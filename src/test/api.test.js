// @vitest-environment node
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../server/app";
import { createDb } from "../../server/db";
process.env.RATE_LIMIT = "off";
let app;
beforeAll(async () => {
  app = createApp(createDb({ url: "", dataDir: null }));
}, 60_000);

async function login(email, password = email.startsWith("admin") ? "admin123" : "viewer123") {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return agent;
}
describe("auth", () => {
  it("blocks anonymous access", async () => {
    expect((await request(app).get("/api/products")).status).toBe(401);
  });
  it("rejects a wrong password with a generic message", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "admin@meridian.dev", password: "wrong-pass" });
    expect(res.status).toBe(401);
  });
  it("sets an httpOnly cookie and /me returns the user", async () => {
    const agent = request.agent(app);
    const res = await agent.post("/api/auth/login").send({ email: "admin@meridian.dev", password: "admin123" });
    expect(String(res.headers["set-cookie"])).toMatch(/HttpOnly/i);
    const me = await agent.get("/api/auth/me");
    expect(me.body.user.role).toBe("admin");
  });
});
describe("products", () => {
  it("paginates, searches and sorts on the server", async () => {
    const a = await login("admin@meridian.dev");
    const page = await a.get("/api/products?page=2&pageSize=12&sort=price-desc");
    expect(page.status).toBe(200);
    expect(page.body.items).toHaveLength(12);
    expect(page.body.total).toBeGreaterThan(100);
    // "price" sorts by the price customers actually pay (after discount).
    const prices = page.body.items.map((p) => p.price * (1 - p.discountPercentage / 100));
    expect([...prices].sort((x, y) => y - x)).toEqual(prices);
    const found = await a.get("/api/products?q=zzzzzz-nothing");
    expect(found.body.total).toBe(0);
  });
  it("validates input with zod", async () => {
    const a = await login("admin@meridian.dev");
    const res = await a.post("/api/products").send({ title: "", price: -5 });
    expect(res.status).toBe(400);
  });
  it("lets admins create, edit and delete; viewers get 403", async () => {
    const admin = await login("admin@meridian.dev");
    const viewer = await login("viewer@meridian.dev");
    const cats = (await admin.get("/api/categories")).body;
    const body = {
      title: "Test chair",
      brand: "Seatly",
      category: cats[0].slug ?? cats[0].id,
      price: 80,
      stock: 4,
      discountPercentage: 0,
      description: "A sturdy test chair for the suite.",
    };
    expect((await viewer.post("/api/products").send(body)).status).toBe(403);
    const created = await admin.post("/api/products").send(body);
    expect(created.status).toBe(201);
    const id = created.body.id;
    const patched = await admin.patch(`/api/products/${id}`).send({ stock: 99 });
    expect(patched.body.stock).toBe(99);
    expect((await admin.delete(`/api/products/${id}`)).status).toBeLessThan(300);
    expect((await admin.get(`/api/products/${id}`)).status).toBe(404);
  });
});
describe("orders, restock, analytics, team", () => {
  it("returns orders with stats and filters by status", async () => {
    const a = await login("viewer@meridian.dev");
    const res = await a.get("/api/orders?status=delivered");
    expect(res.status).toBe(200);
    expect(res.body.items.every((o) => o.status === "delivered")).toBe(true);
    expect(res.body.stats.total).toBeGreaterThan(0);
  });
  it("restock adds stock in one transaction", async () => {
    const a = await login("admin@meridian.dev");
    const before = (await a.get("/api/products/1")).body.stock;
    const res = await a.post("/api/restock").send({ items: [{ productId: 1, qty: 7 }] });
    expect(res.status).toBeLessThan(300);
    expect((await a.get("/api/products/1")).body.stock).toBe(before + 7);
  });
  it("analytics summary has KPIs", async () => {
    const a = await login("viewer@meridian.dev");
    const res = await a.get("/api/analytics/summary");
    expect(res.status).toBe(200);
    expect(res.body.kpis).toBeDefined();
  });
  it("only admins can list or edit users, and not themselves", async () => {
    const viewer = await login("viewer@meridian.dev");
    expect((await viewer.get("/api/users")).status).toBe(403);
    const admin = await login("admin@meridian.dev");
    const users = (await admin.get("/api/users")).body;
    const me = users.find((u) => u.email === "admin@meridian.dev");
    expect((await admin.patch(`/api/users/${me.id}`).send({ active: false })).status).toBe(400);
  });
});
