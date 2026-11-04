import { describe, expect, it } from "vitest";
import { applyReturn, commission, expectedCash } from "@/lib/pos";

describe("returns", () => {
  it("prorates refund by discount and reduces tax and cost", () => {
    // 2 × 100 sold, 10% discount → total 180 incl. tax 0
    const r = applyReturn({ total: 180, tax: 0, cost_total: 120, paid_amount: null }, [{ price: 100, qty: 2 }], [{ price: 100, qty: 1, cost: 60 }]);
    expect(r.refund).toBe(90);
    expect(r.total).toBe(90);
    expect(r.cost_total).toBe(60);
    expect(r.paid_amount).toBeNull();
    expect(r.cashBack).toBe(90);
  });
  it("refund cancels due before giving cash back", () => {
    const r = applyReturn({ total: 200, tax: 20, cost_total: 0, paid_amount: 150 }, [{ price: 100, qty: 2 }], [{ price: 100, qty: 1, cost: 0 }]);
    expect(r.total).toBe(100);
    expect(r.tax).toBe(10);
    expect(r.paid_amount).toBe(100);
    expect(r.cashBack).toBe(50);
  });
});

describe("commission & shift", () => {
  it("is percent of net sales", () => {
    expect(commission([{ total: 110, tax: 10 }, { total: 50, tax: 0 }], 5)).toEqual({ net: 150, commission: 7.5 });
  });
  it("expected cash", () => expect(expectedCash(500, 1200, 100)).toBe(1600));
});
