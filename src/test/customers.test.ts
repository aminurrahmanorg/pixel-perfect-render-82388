import { describe, it, expect } from "vitest";
import { customerDue, earnPoints, redeemValue, saleDue, saleReceived } from "@/lib/customers";
describe("customer dues", () => {
  it("old sales are fully paid", () => expect(saleReceived({ total: 500 })).toBe(500));
  it("partial payment leaves a due", () => expect(saleDue({ total: 500, paid_amount: 200 })).toBe(300));
  it("overpayment is not a negative due", () => expect(saleDue({ total: 500, paid_amount: 600 })).toBe(0));
  it("repayments reduce the due", () =>
    expect(customerDue("c1", [{ total: 500, paid_amount: 200, customer_id: "c1" }, { total: 100, paid_amount: 0, customer_id: "c2" }], [{ amount: 120, customer_id: "c1" }])).toBe(180));
});
describe("loyalty points", () => {
  it("earns per 100 spent, whole points", () => expect(earnPoints(1250, 1)).toBe(12));
  it("no points when off", () => expect(earnPoints(1250, 0)).toBe(0));
  it("redeem capped by balance", () => expect(redeemValue(500, 100, 1, 1000)).toEqual({ value: 100, used: 100 }));
  it("redeem capped by payable", () => expect(redeemValue(500, 500, 1, 80)).toEqual({ value: 80, used: 80 }));
});
