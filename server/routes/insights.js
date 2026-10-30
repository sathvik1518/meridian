import { Router } from "express";
import bcrypt from "bcryptjs";
import { HttpError, audit, parseId, requireRole } from "../http.js";
import { newUserInput, userPatch } from "../validation.js";
import { PRODUCT_COLS } from "./products.js";
import { ORDER_SELECT, loadOrders } from "./orders.js";
import { clearData, loadDemoData } from "../seed.js";

const NET = "oi.price * (1 - oi.discount_percentage / 100) * oi.quantity";

export function insightRoutes(db) {
  const router = Router();
  const admin = requireRole("admin");
  // One request builds the whole dashboard. The database does the counting and adding (that is
  // what it is good at); the browser only draws the result.
  // Start from a blank workspace (keeps logins + categories), or bring the sample data back.
  router.post("/admin/clear-data", admin, async (req, res) => {
    await db.tx(async (q) => {
      await clearData(q);
      await audit(q, req.user, "cleared", "workspace", "all", "Removed all products, orders and customers");
    });
    res.json({ ok: true });
  });
  router.post("/admin/load-demo", admin, async (_req, res) => {
    const [{ n }] = await db.query("SELECT COUNT(*)::int AS n FROM products");
    if (n > 0) throw new HttpError(409, "Demo data can only be loaded into an empty workspace. Clear the data first.");
    await db.tx((q) => loadDemoData(q));
    res.json({ ok: true });
  });
  router.get("/analytics/summary", async (_req, res) => {
    const [stock] = await db.query(`SELECT COUNT(*)::int AS "productCount",
              COALESCE(SUM(price * (1 - discount_percentage / 100) * stock), 0)::float8 AS "inventoryValue",
              (COUNT(*) FILTER (WHERE stock > 0 AND stock <= 15))::int AS low,
              (COUNT(*) FILTER (WHERE stock = 0))::int AS out
       FROM products`);
    const window = (from, to) =>
      db.query(`SELECT COALESCE(SUM(${NET}), 0)::float8 AS revenue, COUNT(DISTINCT o.id)::int AS orders
         FROM orders o JOIN order_items oi ON oi.order_id = o.id
         WHERE o.status <> 'cancelled' AND o.created_at >= now() - interval '${from} days' AND o.created_at < now() - interval '${to} days'`);
    const [[cur], [prev]] = await Promise.all([window(30, 0), window(60, 30)]);
    const revenueByDay =
      await db.query(`SELECT to_char(d, 'YYYY-MM-DD') AS date, COALESCE(SUM(${NET}), 0)::float8 AS revenue, COUNT(DISTINCT o.id)::int AS orders
       FROM generate_series((current_date - 29)::timestamp, current_date::timestamp, interval '1 day') AS d
       LEFT JOIN orders o ON o.created_at::date = d::date AND o.status <> 'cancelled'
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY d ORDER BY d`);
    const byCategory =
      await db.query(`SELECT c.slug, c.name, COALESCE(SUM(p.price * (1 - p.discount_percentage / 100) * p.stock), 0)::float8 AS value, COALESCE(SUM(p.stock), 0)::int AS units
       FROM categories c LEFT JOIN products p ON p.category = c.slug GROUP BY c.slug, c.name ORDER BY value DESC`);
    const lowStockItems = await db.query(
      `SELECT ${PRODUCT_COLS} FROM products p WHERE p.stock <= 15 ORDER BY p.stock ASC, p.rating DESC LIMIT 6`,
    );
    const topRated = await db.query(`SELECT ${PRODUCT_COLS} FROM products p ORDER BY p.rating DESC, p.id LIMIT 5`);
    const priceBuckets = await db.query(`WITH priced AS (SELECT price * (1 - discount_percentage / 100) AS net FROM products)
       SELECT label, COUNT(*)::int AS count FROM (
         SELECT CASE WHEN net < 50 THEN 1 WHEN net < 150 THEN 2 WHEN net < 300 THEN 3 WHEN net < 600 THEN 4 WHEN net < 1000 THEN 5 ELSE 6 END AS bucket,
                CASE WHEN net < 50 THEN 'Under $50' WHEN net < 150 THEN '$50–150' WHEN net < 300 THEN '$150–300' WHEN net < 600 THEN '$300–600' WHEN net < 1000 THEN '$600–1k' ELSE '$1k+' END AS label
         FROM priced) b GROUP BY bucket, label ORDER BY bucket`);
    const recentRows = await db.query(`${ORDER_SELECT} ORDER BY o.created_at DESC, o.id DESC LIMIT 5`);
    const body = {
      kpis: {
        productCount: stock.productCount,
        inventoryValue: stock.inventoryValue,
        lowStock: stock.low,
        outOfStock: stock.out,
        revenue30d: cur.revenue,
        revenuePrev30d: prev.revenue,
        orders30d: cur.orders,
        ordersPrev30d: prev.orders,
        avgOrderValue: cur.orders ? cur.revenue / cur.orders : 0,
      },
      revenueByDay,
      byCategory,
      stockHealth: { healthy: stock.productCount - stock.low - stock.out, low: stock.low, out: stock.out },
      lowStockItems,
      topRated,
      priceBuckets,
      recentOrders: await loadOrders(db, recentRows),
    };
    res.json(body);
  });
  router.get("/activity", async (_req, res) => {
    const rows =
      await db.query(`SELECT id, user_name AS "userName", action, entity, entity_id AS "entityId", detail, created_at AS "createdAt"
       FROM audit_log ORDER BY created_at DESC, id DESC LIMIT 12`);
    res.json(rows);
  });
  /* ------------------------------ Team (admin) ------------------------------ */
  const USER_COLS = `id, name, email, role, title, active, created_at AS "createdAt"`;
  router.get("/users", admin, async (_req, res) => {
    res.json(await db.query(`SELECT ${USER_COLS} FROM users ORDER BY active DESC, role ASC, name ASC`));
  });
  router.post("/users", admin, async (req, res) => {
    const v = newUserInput.parse(req.body);
    const hash = await bcrypt.hash(v.password, 10);
    const created = await db.tx(async (q) => {
      const [row] = await q.query(
        `INSERT INTO users (name, email, password_hash, role, title) VALUES ($1,$2,$3,$4,$5) RETURNING ${USER_COLS}`,
        [v.name, v.email, hash, v.role, v.title],
      );
      await audit(q, req.user, "created", "user", row.id, `${v.name} (${v.role})`);
      return row;
    });
    res.status(201).json(created);
  });
  router.patch("/users/:id", admin, async (req, res) => {
    const id = parseId(req.params.id);
    const v = userPatch.parse(req.body);
    if (id === req.user.id) throw new HttpError(400, "You can't change your own role or deactivate yourself.");
    const updated = await db.tx(async (q) => {
      const [row] = await q.query(
        `UPDATE users SET role = COALESCE($1, role), active = COALESCE($2, active) WHERE id = $3 RETURNING ${USER_COLS}`,
        [v.role ?? null, v.active ?? null, id],
      );
      if (!row) throw new HttpError(404, "That user doesn't exist.");
      await audit(
        q,
        req.user,
        "updated",
        "user",
        id,
        [v.role && `role → ${v.role}`, v.active !== undefined && (v.active ? "reactivated" : "deactivated")].filter(Boolean).join(", "),
      );
      return row;
    });
    res.json(updated);
  });
  return router;
}
