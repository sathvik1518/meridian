import { Router } from "express";
import { HttpError, audit, parseId, requireRole } from "../http.js";
import { newOrderInput, orderQuery, orderStatusInput, restockInput } from "../validation.js";

const LINE_TOTAL = "oi.price * (1 - oi.discount_percentage / 100) * oi.quantity";

const ORDER_SORT = {
  newest: "o.created_at DESC, o.id DESC",
  oldest: "o.created_at ASC, o.id ASC",
  "total-desc": "total DESC, o.id DESC",
  "total-asc": "total ASC, o.id ASC",
};

export async function loadOrders(db, rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const lines = await db.query(
    `SELECT oi.order_id AS "orderId", oi.product_id AS "productId", oi.title, oi.price::float8 AS price,
            oi.discount_percentage::float8 AS "discountPercentage", oi.quantity,
            '/api/art/' || COALESCE(oi.product_id, 0) || '.svg' AS thumbnail
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (${ids.map((_, i) => `$${i + 1}`).join(",")}) ORDER BY oi.id`,
    ids,
  );
  const byOrder = new Map();
  for (const { orderId, ...line } of lines) byOrder.set(orderId, [...(byOrder.get(orderId) ?? []), line]);
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    customer: { id: r.customerId, name: r.customerName, email: r.customerEmail, city: r.customerCity },
    items: byOrder.get(r.id) ?? [],
    itemCount: r.itemCount,
    total: r.total,
  }));
}

export const ORDER_SELECT = `SELECT o.id, o.status, o.created_at AS "createdAt", c.id AS "customerId", c.name AS "customerName",
  c.email AS "customerEmail", c.city AS "customerCity",
  (SELECT COALESCE(SUM(${LINE_TOTAL}), 0)::float8 FROM order_items oi WHERE oi.order_id = o.id) AS total,
  (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS "itemCount"
  FROM orders o JOIN customers c ON c.id = o.customer_id`;
export function orderRoutes(db) {
  const router = Router();
  const admin = requireRole("admin");
  router.get("/orders", async (req, res) => {
    const f = orderQuery.parse(req.query);
    const where = [];
    const params = [];
    if (f.status !== "all") {
      params.push(f.status);
      where.push(`o.status = $${params.length}`);
    }
    if (f.q) {
      const idText = f.q.replace(/^#/, "");
      params.push(`%${f.q.replace(/[%_\\]/g, "\\$&")}%`, idText);
      where.push(`(c.name ILIKE $${params.length - 1} OR c.email ILIKE $${params.length - 1} OR o.id::text = $${params.length})`);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [{ total }] = await db.query(
      `SELECT COUNT(*)::int AS total FROM orders o JOIN customers c ON c.id = o.customer_id ${clause}`,
      params,
    );
    const rows = await db.query(
      `${ORDER_SELECT} ${clause} ORDER BY ${ORDER_SORT[f.sort]} LIMIT ${f.pageSize} OFFSET ${(f.page - 1) * f.pageSize}`,
      params,
    );
    // Headline numbers ignore the filters, so the cards don't change while you search.
    const counts = await db.query("SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status");
    const [money] = await db.query(
      `SELECT COALESCE(SUM(${LINE_TOTAL}), 0)::float8 AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled'`,
    );
    const byStatus = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    counts.forEach((c) => (byStatus[c.status] = c.n));
    const all = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const billable = all - byStatus.cancelled;
    const stats = { total: all, revenue: money.revenue, avgOrder: billable ? money.revenue / billable : 0, byStatus };
    const body = {
      items: await loadOrders(db, rows),
      total,
      page: f.page,
      pageSize: f.pageSize,
      pageCount: Math.max(1, Math.ceil(total / f.pageSize)),
      stats,
    };
    res.json(body);
  });
  // Place an order: find-or-create the customer, take stock off the shelf, record the lines.
  // One transaction, so a stock problem on any line cancels the whole order.
  router.post("/orders", admin, async (req, res) => {
    const v = newOrderInput.parse(req.body);
    const merged = new Map();
    v.items.forEach((i) => merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.quantity));
    const orderId = await db.tx(async (q) => {
      let [customer] = await q.query("SELECT id FROM customers WHERE LOWER(email) = $1 LIMIT 1", [v.customer.email]);
      if (!customer)
        [customer] = await q.query("INSERT INTO customers (name, email, city) VALUES ($1,$2,$3) RETURNING id", [
          v.customer.name,
          v.customer.email,
          v.customer.city,
        ]);
      const [order] = await q.query("INSERT INTO orders (customer_id, status) VALUES ($1, 'pending') RETURNING id", [customer.id]);
      for (const [productId, qty] of merged) {
        // "AND stock >= qty" makes the check and the update one atomic step.
        const [p] = await q.query(
          `UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2 AND stock >= $1
           RETURNING title, price::float8 AS price, discount_percentage::float8 AS discount`,
          [qty, productId],
        );
        if (!p) {
          const [found] = await q.query("SELECT title, stock FROM products WHERE id = $1", [productId]);
          if (!found) throw new HttpError(404, `Product #${productId} no longer exists. Remove it and try again.`);
          throw new HttpError(409, `Only ${found.stock} left of "${found.title}". Lower the quantity.`);
        }
        await q.query(
          "INSERT INTO order_items (order_id, product_id, title, price, discount_percentage, quantity) VALUES ($1,$2,$3,$4,$5,$6)",
          [order.id, productId, p.title, p.price, p.discount, qty],
        );
      }
      await audit(q, req.user, "created", "order", order.id, `${merged.size} products for ${v.customer.name}`);
      return order.id;
    });
    const [row] = await db.query(`${ORDER_SELECT} WHERE o.id = $1`, [orderId]);
    const [order] = await loadOrders(db, row ? [row] : []);
    res.status(201).json(order);
  });

  router.patch("/orders/:id", admin, async (req, res) => {
    const id = parseId(req.params.id);
    const { status } = orderStatusInput.parse(req.body);
    await db.tx(async (q) => {
      const rows = await q.query("UPDATE orders SET status = $1 WHERE id = $2 RETURNING id", [status, id]);
      if (!rows.length) throw new HttpError(404, "That order doesn't exist.");
      await audit(q, req.user, "updated", "order", id, `Marked as ${status}`);
    });
    const [row] = await db.query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
    const [order] = await loadOrders(db, row ? [row] : []);
    res.json(order);
  });
  /* ------------------------------ Restocking ------------------------------ */
  router.post("/restock", admin, async (req, res) => {
    const { items } = restockInput.parse(req.body);
    // Merge duplicate lines, then apply everything in ONE transaction: all lines succeed or none do.
    const merged = new Map();
    items.forEach((i) => merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.qty));
    const result = await db.tx(async (q) => {
      const [order] = await q.query("INSERT INTO restock_orders (created_by) VALUES ($1) RETURNING id", [req.user.id]);
      let units = 0;
      for (const [productId, qty] of merged) {
        const rows = await q.query("UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2 RETURNING id", [
          qty,
          productId,
        ]);
        if (!rows.length) throw new HttpError(404, `Product #${productId} no longer exists. Remove it from the queue and try again.`);
        await q.query("INSERT INTO restock_items (restock_id, product_id, qty) VALUES ($1,$2,$3)", [order.id, productId, qty]);
        units += qty;
      }
      await audit(q, req.user, "restocked", "restock", order.id, `${merged.size} products, ${units} units`);
      return { restockId: order.id, lines: merged.size, units };
    });
    res.status(201).json(result);
  });
  return router;
}
