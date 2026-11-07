import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { format, subDays, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { PageHeader, Panel, Stat } from "@/components/PageHeader";
import { DatePickerField } from "@/components/DatePickerField";
import { Button } from "@/components/ui/button";
import { pctChange, r2, todayIn, useDashboardSummary, useMoney, useRestaurant } from "@/lib/data";
import { Plus, ShoppingCart, Receipt, TrendingUp, Wallet, Landmark, PiggyBank, Coins, HandCoins, Smartphone, Trophy, CalendarRange, Gift, PackageX, Undo2 } from "lucide-react";

const DashboardCharts = lazy(() =>
  import("@/components/DashboardCharts").then((module) => ({ default: module.DashboardCharts })),
);

function DeferredDashboardCharts({
  chart,
  categories,
  money,
}: {
  chart: { day: string; Sales: number; Costs: number; Profit: number }[];
  categories: { name: string; value: number }[];
  money: (amount: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 100px 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="mt-8 min-h-[48rem] xl:min-h-[26rem]">
      {visible ? (
        <Suspense fallback={<div className="h-72 rounded-xl border bg-card" />}>
          <DashboardCharts chart={chart} categories={categories} money={money} />
        </Suspense>
      ) : (
        <div aria-hidden="true" className="h-full min-h-[48rem] rounded-xl xl:min-h-[26rem]" />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Business Manager Pro" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: r } = useRestaurant();
  const money = useMoney();
  const today = todayIn(r?.time_zone);
  const [from, setFrom] = useState(() => today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const periodStart = from <= to ? from : to;
  const periodEnd = from <= to ? to : from;
  const { data: s, error, isPending } = useDashboardSummary(periodStart, periodEnd, today);
  if (error) throw error;
  if (isPending || !s) {
    return <div className="min-h-64 animate-pulse rounded-xl border bg-card" aria-label="Loading dashboard" />;
  }

  const preset = (k: string) => {
    const t = parseISO(today);
    if (k === "today") { setFrom(today); setTo(today); }
    else if (k === "7" || k === "30") { setFrom(format(subDays(t, Number(k) - 1), "yyyy-MM-dd")); setTo(today); }
    else if (k === "month") { setFrom(today.slice(0, 8) + "01"); setTo(today); }
    else if (k === "last") { setFrom(format(startOfMonth(subMonths(t, 1)), "yyyy-MM-dd")); setTo(format(endOfMonth(subMonths(t, 1)), "yyyy-MM-dd")); }
    else if (k === "year") { setFrom(today.slice(0, 5) + "01-01"); setTo(today); }
  };

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
          <p className="text-xs text-muted-foreground">{format(parseISO(periodStart), "MMM d, yyyy")} – {format(parseISO(periodEnd), "MMM d, yyyy")} · {s.cur.orders} orders · avg order {money(avg)}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <DatePickerField label="From" className="sm:w-40" value={from} max={to} onChange={setFrom} />
          <DatePickerField label="To" className="sm:w-40" value={to} min={from} onChange={setTo} />
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

      <DeferredDashboardCharts chart={s.chart} categories={s.cats} money={money} />

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
