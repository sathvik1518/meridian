import { describe, expect, it } from "vitest";
import { discounted, formatBytes, initials, money, stockStatus, titleCase, toCsv } from "../lib/format";
describe("format helpers", () => {
  it("formats money and tolerates bad input", () => {
    expect(money(1234.5)).toBe("$1,234.50");
    expect(money("abc")).toBe("$0.00");
  });
  it("applies a percentage discount", () => {
    expect(discounted(200, 25)).toBe(150);
    expect(discounted(200, 0)).toBe(200);
  });
  it("classifies stock levels", () => {
    expect(stockStatus(0).tone).toBe("bad");
    expect(stockStatus(5).tone).toBe("warn");
    expect(stockStatus(100).tone).toBe("ok");
  });
  it("builds initials and title case", () => {
    expect(initials("Sai Sathvik Goud")).toHaveLength(2);
    expect(titleCase("home-decoration")).toBe("Home Decoration");
  });
  it("formats bytes", () => {
    expect(formatBytes(2048)).toMatch(/KB/);
  });
  it("escapes CSV cells containing commas and quotes", () => {
    const csv = toCsv([{ name: 'A "big", item', qty: 2 }]);
    expect(csv).toContain('"A ""big"", item"');
  });
});
