import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { sum, todayIn, useExpenses, useIncome, useMoney, useRestaurant, useSales } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_app/profit-loss")({
  head: () => ({ meta: [{ title: "Profit & Loss — Business Manager Pro" }] }),
  component: PLPage,
});

function PLPage() {
  const { data: r } = useRestaurant();
  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  const { data: income = [] } = useIncome();
  const money = useMoney();
  const [month, setMonth] = useState(() => todayIn(r?.time_zone).slice(0, 7));

  const pl = useMemo(() => {
    const S = sales.filter((s) => s.sale_date.startsWith(month));
    const E = expenses.filter((e) => e.expense_date.startsWith(month));
    const revenue = sum(S, (s) => Number(s.total) - Number(s.tax));
    const tax = sum(S, (s) => Number(s.tax));
    const cogs = sum(S, (s) => Number(s.cost_total));
    const cats = new Map<string, number>();
    E.forEach((e) => cats.set(e.category, (cats.get(e.category) ?? 0) + Number(e.amount)));
    const opex = sum(E, (e) => Number(e.amount));
    const other = sum(income.filter((i) => i.income_date.startsWith(month)), (i) => Number(i.amount));
    const discount = sum(S, (s) => Number(s.discount));
    return { revenue, tax, cogs, gross: revenue - cogs, cats: [...cats].sort((a, b) => b[1] - a[1]), opex, other, discount, net: revenue - cogs - opex + other };
  }, [sales, expenses, income, month]);

  const Row = ({ label, value, bold, indent }: { label: string; value: number; bold?: boolean; indent?: boolean }) => (
    <div className={`num flex justify-between border-t py-2.5 text-sm ${bold ? "font-semibold" : ""} ${indent ? "pl-4 text-muted-foreground" : ""}`}>
      <span>{label}</span><span className={value < 0 ? "text-destructive" : ""}>{money(value)}</span>
    </div>
  );

  return (
    <div>
      <PageHeader title="Profit & Loss" subtitle="Monthly statement" action={<Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />} />
      <Panel className="max-w-2xl">
        <Row label="Sales revenue (excl. tax)" value={pl.revenue} bold />
        <Row label="Cost of goods sold" value={-pl.cogs} indent />
        <Row label="Gross profit" value={pl.gross} bold />
        <p className="pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operating expenses</p>
        {pl.cats.map(([c, v]) => <Row key={c} label={c} value={-v} indent />)}
        {pl.cats.length === 0 && <p className="py-2 text-sm text-muted-foreground">No expenses this month.</p>}
        <Row label="Total expenses" value={-pl.opex} />
        <Row label="Other income" value={pl.other} />
        <div className={`mt-2 flex justify-between rounded-lg p-4 font-display text-lg font-semibold ${pl.net >= 0 ? "bg-secondary" : "bg-destructive/10 text-destructive"}`}>
          <span>{pl.net >= 0 ? "Net profit" : "Net loss"}</span><span className="num">{money(pl.net)}</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Tax collected this month: {money(pl.tax)} · Discounts given: {money(pl.discount)} (already deducted from revenue)</p>
      </Panel>
    </div>
  );
}
