import { describe, expect, it } from "vitest";
import { calcCart } from "@/lib/pricing";

const store = { tax_enabled: true, tax_mode: "percent", tax_percent: 10, tax_inclusive: false, tax_label: "VAT" };

describe("calcCart", () => {
  it("applies item-wise discount percent", () => {
    const c = calcCart([{ price: 100, qty: 2, discount_percent: 10 }], 0, null);
    expect(c.subtotal).toBe(200);
    expect(c.itemDiscount).toBe(20);
    expect(c.total).toBe(180);
  });
  it("line discount amount overrides percent and is capped at the line", () => {
    expect(calcCart([{ price: 100, qty: 2, discount_percent: 50, discount_amount: 30 }], 0, null).total).toBe(170);
    expect(calcCart([{ price: 100, qty: 1, discount_amount: 500 }], 0, null).total).toBe(0);
  });
  it("uses item VAT override, store rate otherwise", () => {
    const c = calcCart([{ price: 100, qty: 1, tax_percent: 5 }, { price: 100, qty: 1 }], 0, store);
    expect(c.tax).toBe(15);
    expect(c.total).toBe(215);
    expect(c.label).toBe("VAT (item-wise)");
  });
  it("spreads order discount across lines before VAT", () => {
    const c = calcCart([{ price: 100, qty: 1, tax_percent: 0 }, { price: 100, qty: 1, tax_percent: 20 }], 50, store);
    expect(c.taxable).toBe(150);
    expect(c.tax).toBe(15);
    expect(c.total).toBe(165);
  });
  it("inclusive VAT does not raise total", () => {
    const c = calcCart([{ price: 115, qty: 1, tax_percent: 15 }], 0, { ...store, tax_inclusive: true });
    expect(c.tax).toBe(15);
    expect(c.total).toBe(115);
  });
});
