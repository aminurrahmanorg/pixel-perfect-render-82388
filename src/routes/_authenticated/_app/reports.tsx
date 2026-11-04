import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailReports } from "@/components/DetailReports";
import { r2, sum, todayIn, useExpenses, useIncome, useMoney, useRestaurant, useSaleItems, useSales } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Business Manager Pro" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: r } = useRestaurant();
  const { data: sales = [] } = useSales();
  const { data: items = [] } = useSaleItems();
  const { data: expenses = [] } = useExpenses();
  const { data: income = [] } = useIncome();
  const money = useMoney();
  const today = todayIn(r?.time_zone);
  const [from, setFrom] = useState(() => today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);

  const rep = useMemo(() => {
    const inRange = (d: string) => d >= from && d <= to;
    const S = sales.filter((s) => inRange(s.sale_date));
    const E = expenses.filter((e) => inRange(e.expense_date));
    const I = income.filter((i) => inRange(i.income_date));
    const saleIds = new Set(S.map((s) => s.id));
    const lines = items.filter((it) => saleIds.has(it.sale_id));

    const revenue = sum(S, (s) => Number(s.total) - Number(s.tax));
    const tax = sum(S, (s) => Number(s.tax));
    const cogs = sum(S, (s) => Number(s.cost_total));
    const opex = sum(E, (e) => Number(e.amount));
    const other = sum(I, (i) => Number(i.amount));
    const discount = sum(S, (s) => Number(s.discount));
    const net = revenue - cogs - opex + other;

    // Best sellers: aggregate sale lines by item name.
    const agg = new Map<string, { qty: number; revenue: number; cost: number }>();
    lines.forEach((it) => {
      const a = agg.get(it.name) ?? { qty: 0, revenue: 0, cost: 0 };
      a.qty += Number(it.qty);
      a.revenue += Number(it.qty) * Number(it.price);
      a.cost += Number(it.qty) * Number(it.cost);
      agg.set(it.name, a);
    });
    const best = [...agg.entries()]
      .map(([name, a]) => ({ name, qty: r2(a.qty), revenue: r2(a.revenue), profit: r2(a.revenue - a.cost) }))
      .sort((a, b) => b.qty - a.qty);

    // Daily breakdown.
    const days = new Map<string, { sales: number; count: number; expenses: number }>();
    S.forEach((s) => {
      const d = days.get(s.sale_date) ?? { sales: 0, count: 0, expenses: 0 };
      d.sales += Number(s.total) - Number(s.tax);
      d.count += 1;
      days.set(s.sale_date, d);
    });
    E.forEach((e) => {
      const d = days.get(e.expense_date) ?? { sales: 0, count: 0, expenses: 0 };
      d.expenses += Number(e.amount);
      days.set(e.expense_date, d);
    });
    const daily = [...days.entries()]
      .map(([date, d]) => ({ date, ...d, profit: r2(d.sales - d.expenses) }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return { count: S.length, revenue, tax, cogs, opex, other, discount, net, best, daily };
  }, [sales, items, expenses, income, from, to]);

  const Card = ({ label, value, tone }: { label: string; value: number; tone?: "bad" }) => (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`num mt-1 font-display text-xl font-semibold ${tone === "bad" || value < 0 ? "text-destructive" : ""}`}>{money(value)}</p>
    </div>
  );

  return (
    <div>
      <PageHeader title="Reports" subtitle="Pick any date range" />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5"><Label>From</Label><Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-44" /></div>
        <div className="space-y-1.5"><Label>To</Label><Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="w-44" /></div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label={`Sales revenue (${rep.count} orders)`} value={rep.revenue} />
        <Card label="Product cost" value={rep.cogs} />
        <Card label="Expenses" value={rep.opex} />
        <Card label="Other income" value={rep.other} />
      </div>
      <div className={`mb-8 flex items-center justify-between rounded-xl p-5 font-display text-lg font-semibold ${rep.net >= 0 ? "bg-secondary" : "bg-destructive/10 text-destructive"}`}>
        <span>{rep.net >= 0 ? "Net profit for this period" : "Net loss for this period"}</span>
        <span className="num">{money(rep.net)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-display text-base font-semibold">Best-selling items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="pb-2">#</th><th className="pb-2">Item</th><th className="pb-2 text-right">Qty sold</th><th className="pb-2 text-right">Revenue</th><th className="pb-2 text-right">Profit</th></tr>
              </thead>
              <tbody className="num">
                {rep.best.slice(0, 15).map((b, i) => (
                  <tr key={b.name} className="border-t">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{b.name}</td>
                    <td className="py-2 text-right">{b.qty}</td>
                    <td className="py-2 text-right">{money(b.revenue)}</td>
                    <td className="py-2 text-right">{money(b.profit)}</td>
                  </tr>
                ))}
                {rep.best.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No sales in this range.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-3 font-display text-base font-semibold">Day by day</h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="pb-2">Date</th><th className="pb-2 text-right">Orders</th><th className="pb-2 text-right">Sales</th><th className="pb-2 text-right">Expenses</th></tr>
              </thead>
              <tbody className="num">
                {rep.daily.map((d) => (
                  <tr key={d.date} className="border-t">
                    <td className="py-2">{d.date}</td>
                    <td className="py-2 text-right">{d.count}</td>
                    <td className="py-2 text-right">{money(d.sales)}</td>
                    <td className="py-2 text-right">{money(d.expenses)}</td>
                  </tr>
                ))}
                {rep.daily.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nothing recorded in this range.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Tax collected: {money(rep.tax)} · Discounts given: {money(rep.discount)}</p>
      <DetailReports from={from} to={to} />
    </div>
  );
}
