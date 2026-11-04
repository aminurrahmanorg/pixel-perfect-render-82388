import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { aiInsight, type InsightKind } from "@/lib/ai.functions";
import { AlertTriangle, BadgePercent, CalendarCheck, Loader2, PackageSearch, Sparkles, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/insights")({
  head: () => ({ meta: [{ title: "AI Insights — Business Manager Pro" }] }),
  component: InsightsPage,
});

const CARDS: { kind: InsightKind; title: string; desc: string; icon: typeof Sparkles; tone: string }[] = [
  { kind: "daily", title: "Daily summary", desc: "Today vs yesterday and your weekly average", icon: CalendarCheck, tone: "bg-primary/15 text-primary" },
  { kind: "reorder", title: "Smart reorder", desc: "What to restock and how many", icon: PackageSearch, tone: "bg-success/15 text-success" },
  { kind: "forecast", title: "Sales forecast", desc: "Next 7 days and next 30 days", icon: TrendingUp, tone: "bg-chart-2/20 text-chart-2" },
  { kind: "customers", title: "Customer insights", desc: "Best, at-risk and owing customers", icon: Users, tone: "bg-chart-4/20 text-chart-4" },
  { kind: "discount", title: "Discount advisor", desc: "Where a discount will actually help", icon: BadgePercent, tone: "bg-warning/20 text-warning" },
  { kind: "alerts", title: "Unusual activity", desc: "Spikes, losses and odd discounts", icon: AlertTriangle, tone: "bg-destructive/15 text-destructive" },
];

function InsightsPage() {
  const run = useServerFn(aiInsight);
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [out, setOut] = useState<Partial<Record<InsightKind, { text?: string; error?: string; busy?: boolean }>>>({});

  async function go(kind: InsightKind) {
    setOut((o) => ({ ...o, [kind]: { busy: true } }));
    try {
      const r = await run({ data: { kind, lang } });
      setOut((o) => ({ ...o, [kind]: r.error ? { error: r.error } : { text: r.text } }));
    } catch {
      setOut((o) => ({ ...o, [kind]: { error: "Something went wrong. Please try again." } }));
    }
  }

  return (
    <div>
      <PageHeader title="AI Insights" subtitle="One tap analysis of your live store data"
        action={<div className="flex rounded-full border p-1 text-sm">{(["en", "bn"] as const).map((l) => <button key={l} onClick={() => setLang(l)} className={cn("rounded-full px-3 py-1", lang === l && "bg-primary text-primary-foreground")}>{l === "en" ? "English" : "বাংলা"}</button>)}</div>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c) => {
          const o = out[c.kind];
          return (
            <div key={c.kind} className="flex flex-col rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-start gap-3">
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", c.tone)}><c.icon className="size-5" /></span>
                <div className="min-w-0 flex-1"><h3 className="font-display text-base font-semibold">{c.title}</h3><p className="text-sm text-muted-foreground">{c.desc}</p></div>
              </div>
              {o?.text && <div className="mt-4 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-secondary p-3 text-sm">{o.text}</div>}
              {o?.error && <p className="mt-4 text-sm text-destructive">{o.error}</p>}
              <Button className="mt-4" variant={o?.text ? "outline" : "default"} disabled={o?.busy} onClick={() => go(c.kind)}>
                {o?.busy ? <><Loader2 className="animate-spin" /> Analysing…</> : <><Sparkles /> {o?.text ? "Refresh" : "Generate"}</>}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
