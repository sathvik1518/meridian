// @vitest-environment node
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../server/app";
import { createDb } from "../../server/db";

process.env.RATE_LIMIT = "off";
let admin;
let viewer;

// This file uses its OWN database that starts EMPTY (SEED_DEMO=off), like a brand-new workspace.
beforeAll(async () => {
  process.env.SEED_DEMO = "off";
  const app = createApp(createDb({ url: "", dataDir: null }));
  admin = request.agent(app);
  viewer = request.agent(app);
  await admin.post("/api/auth/login").send({ email: "admin@meridian.dev", password: "admin123" }); // waits for setup
  await viewer.post("/api/auth/login").send({ email: "viewer@meridian.dev", password: "viewer123" });
  delete process.env.SEED_DEMO;
}, 60_000);

describe("empty workspace that takes user input", () => {
  it("starts with no products or orders, but the dashboard still works", async () => {
    expect((await admin.get("/api/products")).body.total).toBe(0);
    expect((await admin.get("/api/orders")).body.total).toBe(0);
    const summary = await admin.get("/api/analytics/summary");
    expect(summary.status).toBe(200);
    expect(summary.body.kpis).toBeDefined();
    expect((await admin.get("/api/categories")).body.length).toBeGreaterThan(0);
  });

  it("an admin adds a product, then places an order that lowers its stock", async () => {
    const product = await admin
      .post("/api/products")
      .send({ title: "Desk Lamp", brand: "Lumo", category: "home-office", description: "A warm LED desk lamp.", price: 40, stock: 5 });
    expect(product.status).toBe(201);

    const order = await admin.post("/api/orders").send({
      customer: { name: "Asha Rao", email: "Asha@Example.com", city: "Hyderabad" },
      items: [{ productId: product.body.id, quantity: 2 }],
    });
    expect(order.status).toBe(201);
    expect(order.body.status).toBe("pending");
    expect(order.body.total).toBe(80);
    expect((await admin.get(`/api/products/${product.body.id}`)).body.stock).toBe(3);

    // The same customer email is reused, not duplicated.
    const again = await admin
      .post("/api/orders")
      .send({ customer: { name: "Asha Rao", email: "asha@example.com" }, items: [{ productId: product.body.id, quantity: 1 }] });
    expect(again.body.customer.id).toBe(order.body.customer.id);
  });

  it("refuses to oversell, and changes nothing when it refuses", async () => {
    const list = (await admin.get("/api/products")).body.items;
    const before = list[0].stock;
    const res = await admin
      .post("/api/orders")
      .send({ customer: { name: "Too Many", email: "many@example.com" }, items: [{ productId: list[0].id, quantity: before + 1 }] });
    expect(res.status).toBe(409);
    expect((await admin.get(`/api/products/${list[0].id}`)).body.stock).toBe(before);
  });

  it("validates the order and keeps viewers out", async () => {
    expect((await admin.post("/api/orders").send({ customer: { name: "A", email: "nope" }, items: [] })).status).toBe(400);
    const res = await viewer
      .post("/api/orders")
      .send({ customer: { name: "Viewer Try", email: "v@example.com" }, items: [{ productId: 1, quantity: 1 }] });
    expect(res.status).toBe(403);
    expect((await viewer.post("/api/admin/clear-data")).status).toBe(403);
  });

  it("clear-data empties the workspace and load-demo refills it only when empty", async () => {
    expect((await admin.post("/api/admin/load-demo")).status).toBe(409); // not empty yet
    expect((await admin.post("/api/admin/clear-data")).status).toBe(200);
    expect((await admin.get("/api/products")).body.total).toBe(0);
    expect((await admin.post("/api/admin/load-demo")).status).toBe(200);
    expect((await admin.get("/api/products")).body.total).toBe(120);
    expect((await admin.get("/api/orders")).body.total).toBe(180);
  });
});
