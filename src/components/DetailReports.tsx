import { useMemo, useState } from "react";
import { Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { r2, useCustomerPayments, useCustomers, useMenuItems, useMoney, useSaleItems, useSaleReturns, useSales, useStaff } from "@/lib/data";
import { saleDue } from "@/lib/customers";
import { downloadCsv } from "@/lib/csv";
import { Download } from "lucide-react";

const REPORTS = {
  product: "Sales by product",
  category: "Sales by category",
  brand: "Sales by brand",
  salesperson: "Sales by salesperson & commission",
  customer: "Customer sales & dues",
  vat: "VAT / tax by day",
  returns: "Returns",
  stock: "Stock & valuation",
} as const;
type Key = keyof typeof REPORTS;
type Col = { h: string; money?: boolean };

export function DetailReports({ from, to }: { from: string; to: string }) {
  const { data: sales = [] } = useSales();
  const { data: items = [] } = useSaleItems();
  const { data: menu = [] } = useMenuItems();
  const { data: staff = [] } = useStaff();
  const { data: customers = [] } = useCustomers();
  const { data: payments = [] } = useCustomerPayments();
  const { data: returns = [] } = useSaleReturns();
  const money = useMoney();
  const [key, setKey] = useState<Key>("product");

  const { cols, rows } = useMemo((): { cols: Col[]; rows: (string | number)[][] } => {
    const S = sales.filter((s) => s.sale_date >= from && s.sale_date <= to);
    const ids = new Set(S.map((s) => s.id));
    const L = items.filter((i) => ids.has(i.sale_id));
    const prod = (id: string | null) => menu.find((m) => m.id === id);
    const group = (keyOf: (i: (typeof L)[number]) => string) => {
      const m = new Map<string, { qty: number; rev: number; cost: number }>();
      L.forEach((i) => { const k = keyOf(i) || "—"; const a = m.get(k) ?? { qty: 0, rev: 0, cost: 0 }; a.qty += Number(i.qty); a.rev += Number(i.qty) * Number(i.price); a.cost += Number(i.qty) * Number(i.cost); m.set(k, a); });
      return [...m.entries()].sort((a, b) => b[1].rev - a[1].rev).map(([k, a]) => [k, r2(a.qty), r2(a.rev), r2(a.cost), r2(a.rev - a.cost)]);
    };
    const gcols: Col[] = [{ h: "" }, { h: "Qty" }, { h: "Gross sales", money: true }, { h: "Cost", money: true }, { h: "Gross profit", money: true }];
    switch (key) {
      case "product": return { cols: [{ h: "Product" }, ...gcols.slice(1)], rows: group((i) => i.name) };
      case "category": return { cols: [{ h: "Category" }, ...gcols.slice(1)], rows: group((i) => prod(i.menu_item_id)?.category ?? "") };
      case "brand": return { cols: [{ h: "Brand" }, ...gcols.slice(1)], rows: group((i) => prod(i.menu_item_id)?.brand ?? "No brand") };
      case "salesperson": return {
        cols: [{ h: "Salesperson" }, { h: "Orders" }, { h: "Net sales", money: true }, { h: "Commission %" }, { h: "Commission", money: true }],
        rows: [...staff.map((p) => ({ p, list: S.filter((s) => s.salesperson_id === p.id) })), { p: null, list: S.filter((s) => !s.salesperson_id) }]
          .filter((x) => x.list.length).map(({ p, list }) => { const net = r2(list.reduce((a, s) => a + Number(s.total) - Number(s.tax), 0)); const pc = Number(p?.commission_percent ?? 0); return [p?.name ?? "Not tagged", list.length, net, pc, r2((net * pc) / 100)]; }),
      };
      case "customer": return {
        cols: [{ h: "Customer" }, { h: "Orders" }, { h: "Spent", money: true }, { h: "Due in range", money: true }, { h: "Repaid in range", money: true }],
        rows: customers.map((c) => { const list = S.filter((s) => s.customer_id === c.id); const rep = payments.filter((p) => p.customer_id === c.id && p.payment_date >= from && p.payment_date <= to); return [c.name, list.length, r2(list.reduce((a, s) => a + Number(s.total), 0)), r2(list.reduce((a, s) => a + saleDue(s), 0)), r2(rep.reduce((a, p) => a + Number(p.amount), 0))]; }).filter((r) => Number(r[1]) || Number(r[4])).sort((a, b) => Number(b[2]) - Number(a[2])),
      };
      case "vat": {
        const m = new Map<string, { n: number; taxable: number; tax: number }>();
        S.forEach((s) => { const a = m.get(s.sale_date) ?? { n: 0, taxable: 0, tax: 0 }; a.n++; a.taxable += Number(s.total) - Number(s.tax); a.tax += Number(s.tax); m.set(s.sale_date, a); });
        return { cols: [{ h: "Date" }, { h: "Orders" }, { h: "Taxable sales", money: true }, { h: "Tax collected", money: true }], rows: [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([d, a]) => [d, a.n, r2(a.taxable), r2(a.tax)]) };
      }
      case "returns": return {
        cols: [{ h: "Date" }, { h: "Item" }, { h: "Qty" }, { h: "Refund", money: true }, { h: "Restocked" }, { h: "Reason" }],
        rows: returns.filter((x) => x.return_date >= from && x.return_date <= to).map((x) => [x.return_date, x.name, Number(x.qty), Number(x.refund), x.restock ? "Yes" : "No", x.reason ?? ""]),
      };
      case "stock": return {
        cols: [{ h: "Product" }, { h: "SKU" }, { h: "In stock" }, { h: "Unit cost", money: true }, { h: "Stock value", money: true }, { h: "Status" }],
        rows: menu.filter((m) => m.track_stock).map((m) => { const q = Number(m.stock_qty); return [m.name, m.sku ?? "", q, Number(m.cost), r2(Math.max(0, q) * Number(m.cost)), q <= 0 ? "Out" : q <= Number(m.low_stock_at) ? "Low" : "OK"]; }),
      };
    }
  }, [key, sales, items, menu, staff, customers, payments, returns, from, to]);

  const totals = cols.map((c, i) => (c.money ? r2(rows.reduce((a, r) => a + Number(r[i] ?? 0), 0)) : null));
  return (
    <Panel className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">Detailed reports</h2>
        <div className="flex gap-2">
          <Select value={key} onValueChange={(v) => setKey(v as Key)}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(REPORTS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" disabled={!rows.length} onClick={() => downloadCsv(`${key}-${from}-to-${to}`, cols.map((c) => c.h), rows)}><Download /> CSV</Button>
        </div>
      </div>
      <div className="max-h-[32rem] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground"><tr>{cols.map((c, i) => <th key={c.h} className={`pb-2 ${i ? "text-right" : ""}`}>{c.h}</th>)}</tr></thead>
          <tbody className="num">
            {rows.map((r, ri) => <tr key={ri} className="border-t">{r.map((v, i) => <td key={i} className={`py-2 ${i ? "text-right" : "font-medium"}`}>{cols[i]?.money ? money(Number(v)) : v}</td>)}</tr>)}
            {rows.length === 0 && <tr><td colSpan={cols.length} className="py-6 text-center text-muted-foreground">Nothing in this range.</td></tr>}
            {rows.length > 0 && totals.some((t) => t != null) && <tr className="border-t-2 font-semibold">{totals.map((t, i) => <td key={i} className={`py-2 ${i ? "text-right" : ""}`}>{i === 0 ? "Total" : t != null ? money(t) : ""}</td>)}</tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
