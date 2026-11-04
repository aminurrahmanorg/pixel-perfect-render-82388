import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { PageHeader, Panel } from "@/components/PageHeader";
import { useActivity } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_app/activity")({
  head: () => ({ meta: [{ title: "Activity log — Business Manager Pro" }] }),
  component: ActivityPage,
});

const labels: Record<string, string> = {
  restaurants: "Business settings", accounts: "Account", menu_items: "Product", sales: "Sale",
  expenses: "Expense", income: "Income", transfers: "Transfer",
};
const verb: Record<string, string> = { insert: "Added", update: "Edited", delete: "Deleted" };
const tone: Record<string, string> = { insert: "bg-secondary text-secondary-foreground", update: "bg-accent text-accent-foreground", delete: "bg-destructive/10 text-destructive" };

function ActivityPage() {
  const { data: logs = [] } = useActivity();
  return (
    <div>
      <PageHeader title="Activity log" subtitle="Every change made in your business, newest first" />
      <Panel>
        <ul className="divide-y">
          {logs.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[l.action] ?? ""}`}>{verb[l.action] ?? l.action}</span>
              <span className="font-medium">{labels[l.entity] ?? l.entity}</span>
              <span className="num flex-1 truncate text-muted-foreground">{l.summary}</span>
              <span className="num text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d, yyyy · h:mm a")}</span>
            </li>
          ))}
          {logs.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No activity yet. Add a sale or expense and it will show up here.</li>}
        </ul>
      </Panel>
    </div>
  );
}
