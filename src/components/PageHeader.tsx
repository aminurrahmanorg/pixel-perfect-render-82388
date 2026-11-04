import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-card", className)}>
      {title && <h3 className="mb-4 text-sm font-semibold">{title}</h3>}
      {children}
    </div>
  );
}

const TONES = [
  { bar: "before:bg-chart-1", icon: "bg-chart-1", tint: "from-chart-1/10" },
  { bar: "before:bg-chart-2", icon: "bg-chart-2", tint: "from-chart-2/10" },
  { bar: "before:bg-chart-3", icon: "bg-chart-3", tint: "from-chart-3/10" },
  { bar: "before:bg-chart-4", icon: "bg-chart-4", tint: "from-chart-4/15" },
  { bar: "before:bg-chart-5", icon: "bg-chart-5", tint: "from-chart-5/10" },
  { bar: "before:bg-chart-6", icon: "bg-chart-6", tint: "from-chart-6/10" },
];
const toneFor = (label: string) => TONES[[...label].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

export function Stat({ label, value, change, tone, icon: Icon, color }: { label: string; value: string; change?: number | undefined; tone?: "good" | "bad" | undefined; icon?: LucideIcon; color?: number }) {
  const t = (color !== undefined ? TONES[color % TONES.length] : toneFor(label)) ?? TONES[0]!;
  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-gradient-to-br to-card bg-card p-4 shadow-card before:absolute before:inset-x-0 before:top-0 before:h-1 max-sm:p-3", t.bar, t.tint)}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
        {Icon && (
          <span className={cn("grid size-8 shrink-0 sm:size-9 place-items-center rounded-xl text-primary-foreground shadow-sm", t.icon)}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className={cn("num mt-2 truncate font-display text-base sm:text-lg font-bold md:text-2xl", tone === "bad" && "text-destructive")}>{value}</p>
      {change !== undefined && (
        <p className={cn("num mt-1 text-xs font-medium", change >= 0 ? "text-success" : "text-destructive")}>
          {change >= 0 ? "▲ +" : "▼ "}{change.toFixed(1)}% vs previous period
        </p>
      )}
    </div>
  );
}
