import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays, parseISO, subMonths, startOfMonth, endOfMonth, differenceInCalendarDays } from "date-fns";
import { PageHeader, Panel, Stat } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  accountBalances, pctChange, r2, sum, todayIn, useAccounts, useExpenses, useIncome, useMoney, useRestaurant, useSaleItems, useSales, useTransfers, useCustomerPayments, useMenuItems, useSaleReturns,
} from "@/lib/data";
import { Plus, ShoppingCart, Receipt, TrendingUp, Wallet, Landmark, PiggyBank, Coins, HandCoins, Smartphone, Trophy, CalendarRange, Gift, PackageX, Undo2 } from "lucide-react";
import { saleDue } from "@/lib/customers";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Business Manager Pro" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: r } = useRestaurant();
  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  const { data: accounts = [] } = useAccounts();
  const { data: items = [] } = useSaleItems();
  const { data: income = [] } = useIncome();
  const { data: transfers = [] } = useTransfers();
  const { data: custPayments = [] } = useCustomerPayments();
  const { data: menu = [] } = useMenuItems();
  const { data: returns = [] } = useSaleReturns();
  const money = useMoney();
  const today = todayIn(r?.time_zone);
  const [from, setFrom] = useState(() => today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const preset = (k: string) => {
    const t = parseISO(today);
    if (k === "today") { setFrom(today); setTo(today); }
    else if (k === "7" || k === "30") { setFrom(format(subDays(t, Number(k) - 1), "yyyy-MM-dd")); setTo(today); }
    else if (k === "month") { setFrom(today.slice(0, 8) + "01"); setTo(today); }
    else if (k === "last") { setFrom(format(startOfMonth(subMonths(t, 1)), "yyyy-MM-dd")); setTo(format(endOfMonth(subMonths(t, 1)), "yyyy-MM-dd")); }
    else if (k === "year") { setFrom(today.slice(0, 5) + "01-01"); setTo(today); }
  };

  const s = useMemo(() => {
    const lo = from <= to ? from : to, hi = from <= to ? to : from;
    const len = Math.min(366, differenceInCalendarDays(parseISO(hi), parseISO(lo)) + 1);
    const pHi = format(subDays(parseISO(lo), 1), "yyyy-MM-dd");
    const pLo = format(subDays(parseISO(lo), len), "yyyy-MM-dd");
    const inR = (d: string, a: string, b: string) => d >= a && d <= b;
    // Revenue excludes tax collected; profit = revenue − product cost − expenses + other income
    const S = sales.map((x) => ({ id: x.id, d: x.sale_date, total: Number(x.total) - Number(x.tax), cost: Number(x.cost_total) }));
    const I = income.map((x) => ({ d: x.income_date, amt: Number(x.amount) }));
    const E = expenses.map((x) => ({ d: x.expense_date, amt: Number(x.amount), cat: x.category }));
    const period = (a: string, b: string) => ({
      sales: r2(sum(S.filter((x) => inR(x.d, a, b)), (x) => x.total)),
      cost: r2(sum(S.filter((x) => inR(x.d, a, b)), (x) => x.cost)),
      exp: r2(sum(E.filter((x) => inR(x.d, a, b)), (x) => x.amt)),
      inc: r2(sum(I.filter((x) => inR(x.d, a, b)), (x) => x.amt)),
      orders: S.filter((x) => inR(x.d, a, b)).length,
    });
    const td = period(today, today);
    const bal = accountBalances(accounts, sales, expenses, income, transfers, custPayments);
    const byType = (type: string) => sum(accounts.filter((a) => a.type === type), (a) => bal.get(a.id) ?? 0);
    const cur = period(lo, hi);
    const prev = period(pLo, pHi);
    const chart = Array.from({ length: len }, (_, i) => {
      const d = format(subDays(parseISO(hi), len - 1 - i), "yyyy-MM-dd");
      const p = period(d, d);
      return { day: format(parseISO(d), "MMM d"), Sales: p.sales, Costs: r2(p.exp + p.cost), Profit: r2(p.sales - p.cost - p.exp + p.inc) };
    });
    const catMap = new Map<string, number>();
    E.filter((x) => inR(x.d, lo, hi)).forEach((x) => catMap.set(x.cat, (catMap.get(x.cat) ?? 0) + x.amt));
    const cats = [...catMap].map(([name, value]) => ({ name, value: r2(value) })).sort((a, b) => b.value - a.value);
    const inPeriod = new Set(S.filter((x) => inR(x.d, lo, hi)).map((x) => x.id));
    const itemMap = new Map<string, { qty: number; rev: number; profit: number }>();
    items.filter((i) => inPeriod.has(i.sale_id)).forEach((i) => {
      const e = itemMap.get(i.name) ?? { qty: 0, rev: 0, profit: 0 };
      const q = Number(i.qty);
      e.qty += q; e.rev += q * Number(i.price); e.profit += q * (Number(i.price) - Number(i.cost));
      itemMap.set(i.name, e);
    });
    const top = [...itemMap].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 8);
    return {
      todaySales: td.sales, todayExp: td.exp, todayProfit: r2(td.sales - td.cost - td.exp + td.inc),
      cash: byType("cash"), bank: byType("bank"), wallet: byType("wallet"),
      total: r2([...bal.values()].reduce((a, b) => a + b, 0)),
      cur, prev, chart, cats, top, lo, hi,
      todayOrders: td.orders,
      dues: r2(Math.max(0, sum(sales, (x) => saleDue(x)) - sum(custPayments, (p) => Number(p.amount)))),
      lowStock: menu.filter((m) => m.track_stock && Number(m.stock_qty) <= Number(m.low_stock_at)).length,
      todayReturns: r2(sum(returns.filter((x) => x.return_date === today), (x) => Number(x.refund))),
    };
  }, [menu, returns, sales, expenses, accounts, items, income, transfers, today, from, to]);

  const gross = r2(s.cur.sales - s.cur.cost);
  const net = r2(gross - s.cur.exp + s.cur.inc);
  const pGross = s.prev.sales - s.prev.cost;
  const avg = s.cur.orders ? r2(s.cur.sales / s.cur.orders) : 0;

  return (
    <div>
      <PageHeader
        title={`Good day${r?.owner_name ? `, ${r.owner_name.split(" ")[0]}` : ""}`}
        subtitle={format(new Date(), "EEEE, MMMM d, yyyy")}
        action={
          <div className="flex gap-2">
            <Button asChild><Link to="/sales"><Plus /> New sale</Link></Button>
            <Button asChild variant="outline"><Link to="/expenses"><Plus /> Expense</Link></Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat color={0} label="Today's sales (net)" value={money(s.todaySales)} icon={ShoppingCart} />
        <Stat color={1} label="Today's expenses" value={money(s.todayExp)} icon={Receipt} />
        <Stat color={2} label="Today's profit" value={money(s.todayProfit)} tone={s.todayProfit < 0 ? "bad" : undefined} icon={TrendingUp} />
        <Stat color={3} label="Cash" value={money(s.cash)} icon={Wallet} />
        <Stat color={4} label="Bank" value={money(s.bank)} icon={Landmark} />
        <Stat color={5} label="Mobile wallet" value={money(s.wallet)} icon={Smartphone} />
        <Stat color={6} label="Total balance" value={money(s.total)} icon={PiggyBank} />
        <Stat color={7} label="Today's orders" value={String(s.todayOrders)} icon={ShoppingCart} />
        <Stat color={0} label="Customer dues to collect" value={money(s.dues)} tone={s.dues > 0 ? "bad" : undefined} icon={HandCoins} />
        <Stat color={1} label="Low / out of stock" value={String(s.lowStock)} tone={s.lowStock > 0 ? "bad" : undefined} icon={PackageX} />
        <Stat color={2} label="Today's returns" value={money(s.todayReturns)} icon={Undo2} />
      </div>
      <div className="mb-3 mt-8 flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-card p-4 shadow-card">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold"><CalendarRange className="size-4 text-primary" /> Date to date report</h2>
          <p className="text-xs text-muted-foreground">{format(parseISO(s.lo), "MMM d, yyyy")} – {format(parseISO(s.hi), "MMM d, yyyy")} · {s.cur.orders} orders · avg order {money(avg)}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" className="w-40" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" className="w-40" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} /></div>
          <div className="flex flex-wrap gap-1">
            {[["today","Today"],["7","7D"],["30","30D"],["month","This month"],["last","Last month"],["year","This year"]].map(([k, l]) => (
              <Button key={k} size="sm" variant="outline" onClick={() => preset(k!)}>{l}</Button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat color={2} label="Sales (excl. tax)" value={money(s.cur.sales)} change={pctChange(s.cur.sales, s.prev.sales)} icon={ShoppingCart} />
        <Stat color={3} label="Expenses" value={money(s.cur.exp)} change={pctChange(s.cur.exp, s.prev.exp)} icon={Receipt} />
        <Stat color={4} label="Gross profit" value={money(gross)} change={pctChange(gross, pGross)} icon={Coins} />
        <Stat color={5} label="Net profit" value={money(net)} tone={net < 0 ? "bad" : undefined} change={pctChange(net, pGross - s.prev.exp + s.prev.inc)} icon={TrendingUp} />
        <Stat color={6} label="Product cost" value={money(s.cur.cost)} change={pctChange(s.cur.cost, s.prev.cost)} icon={HandCoins} />
        <Stat color={7} label="Other income" value={money(s.cur.inc)} change={pctChange(s.cur.inc, s.prev.inc)} icon={Gift} />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Sales vs costs (product cost + expenses) — selected period</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={s.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={50} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Area dataKey="Sales" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2} />
                <Area dataKey="Costs" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.1} strokeWidth={2} />
                <Area dataKey="Profit" stroke="var(--chart-3)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Top expenses (selected period)">
          {s.cats.length === 0 ? <p className="text-sm text-muted-foreground">No expenses yet.</p> : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={s.cats} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-4">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Trophy className="size-4 text-warning" /> Best-selling items (selected period)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2">Item</th><th className="pb-2 text-right">Sold</th><th className="pb-2 text-right">Revenue</th><th className="pb-2 text-right">Profit</th></tr>
            </thead>
            <tbody className="num">
              {s.top.map((t) => (
                <tr key={t.name} className="border-t">
                  <td className="py-2 font-medium">{t.name}</td>
                  <td className="py-2 text-right">{t.qty}</td>
                  <td className="py-2 text-right">{money(t.rev)}</td>
                  <td className="py-2 text-right text-success">{money(t.profit)}</td>
                </tr>
              ))}
              {s.top.length === 0 && <tr><td colSpan={4} className="py-4 text-muted-foreground">No sales yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
