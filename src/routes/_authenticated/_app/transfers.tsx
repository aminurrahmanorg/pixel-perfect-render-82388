import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accountBalances, todayIn, useAccounts, useExpenses, useIncome, useMoney, useRefresh, useRestaurant, useSales, useTransfers, useCustomerPayments } from "@/lib/data";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/transfers")({
  head: () => ({ meta: [{ title: "Transfers — Business Manager Pro" }] }),
  component: TransfersPage,
});

function TransfersPage() {
  const { data: transfers = [] } = useTransfers();
  const { data: accounts = [] } = useAccounts();
  const money = useMoney();
  const refresh = useRefresh();
  const name = (id: string) => accounts.find((a) => a.id === id)?.name ?? "—";
  return (
    <div>
      <PageHeader title="Transfers" subtitle="Move money between cash, bank and wallet" action={<NewTransfer />} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2">Date</th><th className="pb-2">From → To</th><th className="pb-2">Note</th><th className="pb-2 text-right">Amount</th><th /></tr>
            </thead>
            <tbody className="num">
              {transfers.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="py-2">{t.transfer_date}</td>
                  <td className="py-2"><span className="inline-flex items-center gap-1">{name(t.from_account_id)} <ArrowRight className="size-3" /> {name(t.to_account_id)}</span></td>
                  <td className="py-2 text-muted-foreground">{t.note}</td>
                  <td className="py-2 text-right font-medium">{money(Number(t.amount))}</td>
                  <td className="py-2 text-right">
                    <Button size="icon" variant="ghost" aria-label="Delete" onClick={async () => {
                      if (!confirm("Delete this transfer?")) return;
                      const { error } = await supabase.from("transfers").delete().eq("id", t.id);
                      if (error) toast.error(error.message); else refresh();
                    }}><Trash2 className="size-4" /></Button>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No transfers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function NewTransfer() {
  const { data: r } = useRestaurant();
  const { data: accounts = [] } = useAccounts();
  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  const { data: income = [] } = useIncome();
  const { data: transfers = [] } = useTransfers();
  const { data: custPayments = [] } = useCustomerPayments();
  const money = useMoney();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ transfer_date: "", from_account_id: "", to_account_id: "", amount: 0, note: "" });
  const bal = accountBalances(accounts, sales, expenses, income, transfers, custPayments);
  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) setV({ transfer_date: todayIn(r?.time_zone), from_account_id: accounts[0]?.id ?? "", to_account_id: accounts[1]?.id ?? "", amount: 0, note: "" });
    }}>
      <DialogTrigger asChild><Button><Plus /> New transfer</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Transfer money</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (v.from_account_id === v.to_account_id) return void toast.error("Choose two different accounts");
          if (v.amount <= 0) return void toast.error("Amount must be greater than zero");
          if (v.amount > (bal.get(v.from_account_id) ?? 0)) return void toast.error("Not enough balance in the source account");
          const { error } = await supabase.from("transfers").insert(v);
          if (error) return void toast.error(error.message);
          setOpen(false); refresh();
        }}>
          <div className="grid grid-cols-2 gap-3">
            {(["from_account_id", "to_account_id"] as const).map((k) => (
              <div key={k} className="space-y-1.5"><Label>{k === "from_account_id" ? "From" : "To"}</Label>
                <Select value={v[k]} onValueChange={(x) => setV({ ...v, [k]: x })}>
                  <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({money(bal.get(a.id) ?? 0)})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={v.transfer_date} onChange={(e) => setV({ ...v, transfer_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Amount</Label><Input type="number" step="0.01" value={v.amount} onChange={(e) => setV({ ...v, amount: Number(e.target.value) })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Note</Label><Input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} /></div>
          <Button type="submit" className="w-full">Transfer</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
