import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, todayIn, useAccounts, useExpenses, useMoney, useRefresh, useRestaurant } from "@/lib/data";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Business Manager Pro" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { data: expenses = [] } = useExpenses();
  const { data: accounts = [] } = useAccounts();
  const money = useMoney();
  const refresh = useRefresh();
  const [cat, setCat] = useState("all");
  const list = expenses.filter((e) => cat === "all" || e.category === cat);
  return (
    <div>
      <PageHeader title="Expenses" subtitle="Rent, salaries, utilities and everything else" action={<NewExpense />} />
      <Panel>
        <div className="mb-4 max-w-xs">
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2">Date</th><th className="pb-2">Category</th><th className="pb-2">Description</th><th className="pb-2">Paid from</th><th className="pb-2 text-right">Amount</th><th /></tr>
            </thead>
            <tbody className="num">
              {list.slice(0, 300).map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="py-2">{e.expense_date}</td>
                  <td className="py-2"><span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{e.category}</span></td>
                  <td className="py-2 text-muted-foreground">{e.description}</td>
                  <td className="py-2">{accounts.find((a) => a.id === e.account_id)?.name ?? "—"}</td>
                  <td className="py-2 text-right font-medium">{money(Number(e.amount))}</td>
                  <td className="py-2 text-right">
                    <Button size="icon" variant="ghost" aria-label="Delete" onClick={async () => {
                      if (!confirm("Delete this expense?")) return;
                      const { error } = await supabase.from("expenses").delete().eq("id", e.id);
                      if (error) toast.error(error.message); else refresh();
                    }}><Trash2 className="size-4" /></Button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No expenses found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function NewExpense() {
  const { data: r } = useRestaurant();
  const { data: accounts = [] } = useAccounts();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ expense_date: "", category: "Other", description: "", amount: 0, account_id: "" });
  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) setV({ expense_date: todayIn(r?.time_zone), category: "Other", description: "", amount: 0, account_id: accounts.find((a) => a.type === "cash")?.id ?? "" });
    }}>
      <DialogTrigger asChild><Button><Plus /> Add expense</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (v.amount <= 0) return void toast.error("Amount must be greater than zero");
          const { error } = await supabase.from("expenses").insert({ ...v, account_id: v.account_id || null });
          if (error) return void toast.error(error.message);
          toast.success("Expense added");
          setOpen(false); refresh();
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={v.expense_date} onChange={(e) => setV({ ...v, expense_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Amount</Label><Input type="number" step="0.01" required value={v.amount} onChange={(e) => setV({ ...v, amount: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={v.category} onValueChange={(c) => setV({ ...v, category: c })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Paid from</Label>
              <Select value={v.account_id} onValueChange={(c) => setV({ ...v, account_id: c })}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
          <Button type="submit" className="w-full">Save expense</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
