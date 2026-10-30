import { describe, expect, it } from "vitest";
import { loginSchema, productSchema, userSchema } from "../validation/productSchema";

const valid = {
  title: "Desk lamp",
  brand: "Lumo",
  category: "lighting",
  price: "49.99",
  stock: "10",
  discountPercentage: 5,
  description: "A warm LED lamp for your desk.",
  thumbnail: null,
};
describe("productSchema", () => {
  it("accepts a valid product", async () => {
    await expect(productSchema.isValid(valid)).resolves.toBe(true);
  });
  it("rejects a negative price and a missing title", async () => {
    await expect(productSchema.isValid({ ...valid, price: "-1" })).resolves.toBe(false);
    await expect(productSchema.isValid({ ...valid, title: "" })).resolves.toBe(false);
  });
  it("rejects a discount above 90%", async () => {
    await expect(productSchema.isValid({ ...valid, discountPercentage: 95 })).resolves.toBe(false);
  });
});
describe("loginSchema / userSchema", () => {
  it("requires a valid email and a password", async () => {
    await expect(loginSchema.isValid({ email: "nope", password: "x", remember: false })).resolves.toBe(false);
    await expect(loginSchema.isValid({ email: "a@b.co", password: "secret123", remember: false })).resolves.toBe(true);
  });
  it("requires an 8+ character password for new members", async () => {
    const base = { name: "Jo Doe", email: "jo@x.co", role: "viewer", title: "" };
    await expect(userSchema.isValid({ ...base, password: "short" })).resolves.toBe(false);
    await expect(userSchema.isValid({ ...base, password: "longenough1" })).resolves.toBe(true);
  });
});
