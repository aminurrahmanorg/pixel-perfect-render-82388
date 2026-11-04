import { r2, type TaxSettings } from "@/lib/data";

/** discount_amount (whole line, overrides percent when set) */
export type CartLine = { price: number; qty: number; discount_percent?: number | null; discount_amount?: number | null; tax_percent?: number | null };

/** Cart math with item-wise discount and item-wise VAT (falls back to store rate). */
export function calcCart(lines: CartLine[], orderDiscount: number, t: TaxSettings | null | undefined, apply = true) {
  const rows = lines.map((l) => {
    const gross = r2(l.qty * Number(l.price));
    const disc = l.discount_amount != null
      ? r2(Math.min(gross, Math.max(0, Number(l.discount_amount))))
      : r2(gross * Math.min(100, Math.max(0, Number(l.discount_percent ?? 0))) / 100);
    return { gross, disc, net: r2(gross - disc), rate: l.tax_percent ?? null };
  });
  const subtotal = r2(rows.reduce((a, x) => a + x.gross, 0));
  const itemDiscount = r2(rows.reduce((a, x) => a + x.disc, 0));
  const netSum = r2(subtotal - itemDiscount);
  const od = r2(Math.min(Math.max(0, orderDiscount), netSum));
  const taxable = r2(netSum - od);
  const base = { subtotal, itemDiscount, orderDiscount: od, taxable };
  if (!apply || !t?.tax_enabled || taxable === 0) return { ...base, tax: 0, total: taxable, label: "" };
  const name = t.tax_label || "VAT";
  if (t.tax_mode === "fixed") {
    const tax = r2(Math.max(0, Number(t.tax_fixed ?? 0)));
    return { ...base, tax, total: r2(taxable + tax), label: name };
  }
  const storeRate = Math.max(0, Number(t.tax_percent ?? 0));
  const ratio = netSum ? taxable / netSum : 0;
  let tax = 0;
  const rates = new Set<number>();
  for (const x of rows) {
    const rate = x.rate == null ? storeRate : Math.max(0, Number(x.rate));
    rates.add(rate);
    const lt = x.net * ratio;
    tax += t.tax_inclusive ? lt - lt / (1 + rate / 100) : (lt * rate) / 100;
  }
  tax = r2(tax);
  const label = rates.size > 1 ? `${name} (item-wise)` : `${name} ${[...rates][0] ?? storeRate}%${t.tax_inclusive ? " incl." : ""}`;
  return { ...base, tax, total: t.tax_inclusive ? taxable : r2(taxable + tax), label };
}
