import { r2 } from "@/lib/data";

type SaleLike = { total: number; tax: number; cost_total: number; paid_amount: number | null };
type ItemLike = { price: number; qty: number };

/**
 * Returning items edits the original sale so every report and balance stays correct.
 * Refund is prorated by what the customer actually paid per unit (after discounts/points).
 * The refund first cancels any due on the sale; the rest is cash back from the sale's account.
 */
export function applyReturn(sale: SaleLike, saleItems: ItemLike[], ret: { price: number; qty: number; cost: number }[]) {
  const total = Number(sale.total), tax = Number(sale.tax);
  const gross = saleItems.reduce((a, i) => a + Number(i.qty) * Number(i.price), 0);
  const ratio = gross > 0 ? total / gross : 0;
  const refund = r2(Math.min(total, ret.reduce((a, x) => a + x.qty * x.price * ratio, 0)));
  const newTotal = r2(total - refund);
  const newTax = total > 0 ? r2(tax * (newTotal / total)) : 0;
  const newCost = r2(Math.max(0, Number(sale.cost_total) - ret.reduce((a, x) => a + x.qty * x.cost, 0)));
  const paid = sale.paid_amount == null ? total : Number(sale.paid_amount);
  const newPaid = r2(Math.min(paid, newTotal));
  return { refund, cashBack: r2(paid - newPaid), total: newTotal, tax: newTax, cost_total: newCost, paid_amount: sale.paid_amount == null ? null : newPaid };
}

/** Commission is a percent of net sales (total minus tax). */
export function commission(sales: { total: number; tax: number }[], percent: number) {
  const net = r2(sales.reduce((a, s) => a + Number(s.total) - Number(s.tax), 0));
  return { net, commission: r2((net * Math.max(0, percent)) / 100) };
}

/** Cash expected in the drawer at shift close. */
export const expectedCash = (opening: number, cashIn: number, cashOut = 0) => r2(opening + cashIn - cashOut);
