import { r2 } from "@/lib/data";

type SaleLike = { total: number | string; paid_amount?: number | string | null; customer_id?: string | null };
type PaymentLike = { amount: number | string; customer_id: string };

/** Amount actually received for a sale. Older sales (no paid_amount) were fully paid. */
export const saleReceived = (s: SaleLike) => (s.paid_amount == null ? Number(s.total) : Number(s.paid_amount));
/** Unpaid part of a sale (never negative). */
export const saleDue = (s: SaleLike) => r2(Math.max(0, Number(s.total) - saleReceived(s)));

/** Customer due = unpaid parts of their sales − repayments collected. */
export function customerDue(customerId: string, sales: SaleLike[], payments: PaymentLike[]) {
  const owed = sales.filter((s) => s.customer_id === customerId).reduce((a, s) => a + saleDue(s), 0);
  const paid = payments.filter((p) => p.customer_id === customerId).reduce((a, p) => a + Number(p.amount), 0);
  return r2(Math.max(0, owed - paid));
}

/** Points earned: whole points, `per100` points for every 100 spent. */
export const earnPoints = (amount: number, per100: number) => (per100 > 0 && amount > 0 ? Math.floor((amount * per100) / 100) : 0);

/** Money value of redeemed points, capped by the points balance and the amount payable. */
export function redeemValue(points: number, balance: number, pointValue: number, maxAmount: number) {
  const usable = Math.max(0, Math.min(Math.floor(points), Math.floor(balance)));
  const value = r2(Math.min(usable * pointValue, Math.max(0, maxAmount)));
  const used = pointValue > 0 ? Math.ceil(r2(value / pointValue)) : 0;
  return { value, used };
}
