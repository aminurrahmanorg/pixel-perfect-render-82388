import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/PageHeader";

type DashboardChartPoint = { day: string; Sales: number; Costs: number; Profit: number };
type ExpenseCategory = { name: string; value: number };

export function DashboardCharts({
  chart,
  categories,
  money,
}: {
  chart: DashboardChartPoint[];
  categories: ExpenseCategory[];
  money: (amount: number) => string;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel className="xl:col-span-2">
        <h3 className="mb-4 text-sm font-semibold">
          Sales vs costs (product cost + expenses) — selected period
        </h3>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={50} />
              <Tooltip formatter={(value: number) => money(value)} />
              <Area
                dataKey="Sales"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                dataKey="Costs"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area dataKey="Profit" stroke="var(--chart-3)" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Top expenses (selected period)">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses yet.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={categories} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip formatter={(value: number) => money(value)} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
    </div>
  );
}
