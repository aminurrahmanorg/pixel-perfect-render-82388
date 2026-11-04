import { describe, it, expect } from "vitest";
import { calcTax } from "@/lib/data";
describe("calcTax", () => {
  it("no tax when disabled", () => expect(calcTax(100, { tax_enabled: false, tax_percent: 15 })).toMatchObject({ tax: 0, total: 100 }));
  it("percent exclusive", () => expect(calcTax(200, { tax_enabled: true, tax_mode: "percent", tax_percent: 15 })).toMatchObject({ tax: 30, total: 230 }));
  it("percent inclusive", () => expect(calcTax(115, { tax_enabled: true, tax_percent: 15, tax_inclusive: true })).toMatchObject({ tax: 15, total: 115 }));
  it("fixed amount", () => expect(calcTax(200, { tax_enabled: true, tax_mode: "fixed", tax_fixed: 10 })).toMatchObject({ tax: 10, total: 210 }));
  it("skipped per sale", () => expect(calcTax(200, { tax_enabled: true, tax_percent: 15 }, false)).toMatchObject({ tax: 0, total: 200 }));
});
