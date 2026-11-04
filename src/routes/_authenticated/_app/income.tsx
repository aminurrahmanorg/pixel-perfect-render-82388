import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INCOME_SOURCES, sum, todayIn, useAccounts, useIncome, useMoney, useRefresh, useRestaurant } from "@/lib/data";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/income")({
  head: () => ({ meta: [{ title: "Other income — Business Manager Pro" }] }),
  component: IncomePage,
});

function IncomePage() {
  const { data: income = [] } = useIncome();
  const { data: accounts = [] } = useAccounts();
  const money = useMoney();
  const refresh = useRefresh();
  return (
    <div>
      <PageHeader title="Other income" subtitle={`Catering, events, commissions · Total ${money(sum(income, (i) => Number(i.amount)))}`} action={<NewIncome />} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2">Date</th><th className="pb-2">Source</th><th className="pb-2">Description</th><th className="pb-2">Received in</th><th className="pb-2 text-right">Amount</th><th /></tr>
            </thead>
            <tbody className="num">
              {income.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="py-2">{i.income_date}</td>
                  <td className="py-2">{i.source}</td>
                  <td className="py-2 text-muted-foreground">{i.description}</td>
                  <td className="py-2">{accounts.find((a) => a.id === i.account_id)?.name ?? "—"}</td>
                  <td className="py-2 text-right font-medium text-success">{money(Number(i.amount))}</td>
                  <td className="py-2 text-right">
                    <Button size="icon" variant="ghost" aria-label="Delete" onClick={async () => {
                      if (!confirm("Delete this income?")) return;
                      const { error } = await supabase.from("income").delete().eq("id", i.id);
                      if (error) toast.error(error.message); else refresh();
                    }}><Trash2 className="size-4" /></Button>
                  </td>
                </tr>
              ))}
              {income.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No other income yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function NewIncome() {
  const { data: r } = useRestaurant();
  const { data: accounts = [] } = useAccounts();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ income_date: "", source: "Other", description: "", amount: 0, account_id: "" });
  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) setV({ income_date: todayIn(r?.time_zone), source: "Other", description: "", amount: 0, account_id: accounts[0]?.id ?? "" });
    }}>
      <DialogTrigger asChild><Button><Plus /> Add income</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add other income</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (v.amount <= 0) return void toast.error("Amount must be greater than zero");
          const { error } = await supabase.from("income").insert({ ...v, account_id: v.account_id || null });
          if (error) return void toast.error(error.message);
          setOpen(false); refresh();
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={v.income_date} onChange={(e) => setV({ ...v, income_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Amount</Label><Input type="number" step="0.01" value={v.amount} onChange={(e) => setV({ ...v, amount: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Source</Label>
              <Select value={v.source} onValueChange={(x) => setV({ ...v, source: x })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INCOME_SOURCES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Received in</Label>
              <Select value={v.account_id} onValueChange={(x) => setV({ ...v, account_id: x })}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
