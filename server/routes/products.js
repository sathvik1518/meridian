import { Router } from "express";
import { HttpError, audit, parseId, requireRole } from "../http.js";
import { SORT_SQL, productInput, productPatch, productQuery } from "../validation.js";

export const PRODUCT_COLS = `p.id, p.sku, p.title, p.brand, p.category, p.description,
  p.price::float8 AS price, p.discount_percentage::float8 AS "discountPercentage", p.stock,
  p.rating::float8 AS rating, '/api/art/' || p.id || '.svg' AS thumbnail,
  p.created_at AS "createdAt", p.updated_at AS "updatedAt"`;
const HUES = {
  laptops: 215,
  smartphones: 265,
  audio: 335,
  wearables: 160,
  cameras: 25,
  gaming: 285,
  "home-office": 195,
  kitchen: 15,
  fitness: 140,
  accessories: 45,
};

function artSvg(title, category, id) {
  const hue = HUES[category] ?? (id * 47) % 360;
  const h2 = (hue + 38) % 360;
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .replace(/[<>&"']/g, "");
  const r = (id * 37) % 40;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="${category}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 62%)"/><stop offset="1" stop-color="hsl(${h2} 72% 42%)"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#g)"/>
<circle cx="${60 + r}" cy="${50 + (r % 20)}" r="${70 + (r % 25)}" fill="#fff" opacity=".10"/>
<circle cx="${190 - r}" cy="${200 - (r % 30)}" r="${60 + (r % 30)}" fill="#000" opacity=".10"/>
<rect x="64" y="64" width="112" height="112" rx="28" fill="#fff" opacity=".18"/>
<text x="120" y="136" font-family="system-ui,sans-serif" font-size="44" font-weight="700" text-anchor="middle" fill="#fff">${initials}</text></svg>`;
}

export function productRoutes(db) {
  const router = Router();
  const admin = requireRole("admin");
  /* ------------------------------- Reading ------------------------------- */
  router.get("/categories", async (_req, res) => {
    const rows = await db.query(`SELECT c.slug, c.name, COUNT(p.id)::int AS count FROM categories c
       LEFT JOIN products p ON p.category = c.slug GROUP BY c.slug, c.name ORDER BY c.name`);
    res.json(rows);
  });
  router.get("/products", async (req, res) => {
    const f = productQuery.parse(req.query);
    const where = [];
    const params = [];
    if (f.q) {
      params.push(`%${f.q.replace(/[%_\\]/g, "\\$&")}%`);
      where.push(
        `(p.title ILIKE $${params.length} OR p.brand ILIKE $${params.length} OR p.category ILIKE $${params.length} OR p.sku ILIKE $${params.length})`,
      );
    }
    if (f.category) {
      params.push(f.category);
      where.push(`p.category = $${params.length}`);
    }
    if (f.stock === "low") where.push("p.stock > 0 AND p.stock <= 15");
    if (f.stock === "out") where.push("p.stock = 0");
    if (f.stock === "attention") where.push("p.stock <= 15");
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [{ total }] = await db.query(`SELECT COUNT(*)::int AS total FROM products p ${clause}`, params);
    const items = await db.query(
      `SELECT ${PRODUCT_COLS} FROM products p ${clause} ORDER BY ${SORT_SQL[f.sort]} LIMIT ${f.pageSize} OFFSET ${(f.page - 1) * f.pageSize}`,
      params,
    );
    const body = { items, total, page: f.page, pageSize: f.pageSize, pageCount: Math.max(1, Math.ceil(total / f.pageSize)) };
    res.json(body);
  });
  router.get("/products/suggest", async (req, res) => {
    const q = String(req.query.q ?? "")
      .trim()
      .slice(0, 80);
    if (q.length < 2) return void res.json([]);
    const rows = await db.query(
      `SELECT ${PRODUCT_COLS} FROM products p WHERE p.title ILIKE $1 OR p.brand ILIKE $1 OR p.sku ILIKE $1 ORDER BY p.rating DESC LIMIT 6`,
      [`%${q.replace(/[%_\\]/g, "\\$&")}%`],
    );
    res.json(rows);
  });
  router.get("/products/:id", async (req, res) => {
    const [row] = await db.query(`SELECT ${PRODUCT_COLS} FROM products p WHERE p.id = $1`, [parseId(req.params.id)]);
    if (!row) throw new HttpError(404, "That product doesn't exist (it may have been deleted).");
    res.json(row);
  });
  /* ------------------------------- Writing ------------------------------- */
  async function assertCategory(slug) {
    if (slug === undefined) return;
    const [hit] = await db.query("SELECT 1 FROM categories WHERE slug = $1", [slug]);
    if (!hit) throw new HttpError(400, "Unknown category.");
  }
  router.post("/products", admin, async (req, res) => {
    const v = productInput.parse(req.body);
    await assertCategory(v.category);
    const created = await db.tx(async (q) => {
      const [{ n }] = await q.query("SELECT COALESCE(MAX(id), 0)::int + 1 AS n FROM products");
      const [row] = await q.query(
        `INSERT INTO products (sku, title, brand, category, description, price, discount_percentage, stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          `MRD-${v.category.slice(0, 3).toUpperCase()}-${1000 + n}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
          v.title,
          v.brand,
          v.category,
          v.description,
          v.price,
          v.discountPercentage,
          v.stock,
        ],
      );
      await audit(q, req.user, "created", "product", row.id, v.title);
      const [full] = await q.query(`SELECT ${PRODUCT_COLS} FROM products p WHERE p.id = $1`, [row.id]);
      return full;
    });
    res.status(201).json(created);
  });
  router.patch("/products/:id", admin, async (req, res) => {
    const id = parseId(req.params.id);
    const v = productPatch.parse(req.body);
    await assertCategory(v.category);
    const columns = {
      title: "title",
      brand: "brand",
      category: "category",
      description: "description",
      price: "price",
      discountPercentage: "discount_percentage",
      stock: "stock",
    };
    const sets = [];
    const params = [];
    for (const [key, value] of Object.entries(v)) {
      if (value === undefined || !columns[key]) continue;
      params.push(value);
      sets.push(`${columns[key]} = $${params.length}`);
    }
    params.push(id);
    const updated = await db.tx(async (q) => {
      const rows = await q.query(
        `UPDATE products SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING id`,
        params,
      );
      if (!rows.length) throw new HttpError(404, "That product doesn't exist (it may have been deleted).");
      await audit(q, req.user, "updated", "product", id, Object.keys(v).join(", "));
      const [full] = await q.query(`SELECT ${PRODUCT_COLS} FROM products p WHERE p.id = $1`, [id]);
      return full;
    });
    res.json(updated);
  });
  router.delete("/products/:id", admin, async (req, res) => {
    const id = parseId(req.params.id);
    await db.tx(async (q) => {
      const [row] = await q.query("DELETE FROM products WHERE id = $1 RETURNING title", [id]);
      if (!row) throw new HttpError(404, "That product doesn't exist (it may have been deleted).");
      await audit(q, req.user, "deleted", "product", id, row.title);
    });
    res.json({ id });
  });
  // Generated artwork for every product, so the demo needs no image host.
  router.get("/art/:file", async (req, res) => {
    const id = Number(String(req.params.file).replace(/\.svg$/, ""));
    const [row] = Number.isInteger(id) ? await db.query("SELECT title, category FROM products WHERE id = $1", [id]) : [];
    res.set({
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    });
    res.send(artSvg(row?.title ?? "Product", row?.category ?? "misc", Number.isInteger(id) ? id : 0));
  });
  return router;
}
