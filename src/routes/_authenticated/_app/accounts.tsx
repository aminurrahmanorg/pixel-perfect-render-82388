import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accountBalances, useAccounts, useExpenses, useIncome, useMoney, useRefresh, useSales, useTransfers, useCustomerPayments } from "@/lib/data";
import { Banknote, Landmark, Plus, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Business Manager Pro" }] }),
  component: AccountsPage,
});

const icons = { cash: Banknote, bank: Landmark, wallet: Smartphone } as Record<string, typeof Banknote>;

function AccountsPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  const money = useMoney();
  const refresh = useRefresh();
  const { data: income = [] } = useIncome();
  const { data: transfers = [] } = useTransfers();
  const { data: custPayments = [] } = useCustomerPayments();
  const bal = accountBalances(accounts, sales, expenses, income, transfers, custPayments);
  const total = [...bal.values()].reduce((a, b) => a + b, 0);
  return (
    <div>
      <PageHeader title="Accounts" subtitle="Cash, bank and mobile wallet balances" action={<NewAccount />} />
      <div className="mb-6 rounded-xl bg-brand p-6 text-primary-foreground shadow-card">
        <p className="text-sm opacity-80">Total money in the business</p>
        <p className="num mt-1 font-display text-3xl font-semibold">{money(total)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {accounts.map((a) => {
          const Icon = icons[a.type] ?? Banknote;
          const b = bal.get(a.id) ?? 0;
          return (
            <div key={a.id} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary"><Icon className="size-5" /></span>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={async () => {
                  if (!confirm(`Delete ${a.name}? Linked sales and expenses will keep their amounts but lose this account.`)) return;
                  const { error } = await supabase.from("accounts").delete().eq("id", a.id);
                  if (error) toast.error(error.message); else refresh();
                }}><Trash2 className="size-4" /></Button>
              </div>
              <p className="mt-4 font-medium">{a.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{a.type === "wallet" ? "Mobile wallet" : a.type}</p>
              <p className={`num mt-3 font-display text-2xl font-semibold ${b < 0 ? "text-destructive" : ""}`}>{money(b)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewAccount() {
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ name: "", type: "cash", opening_balance: 0 });
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setV({ name: "", type: "cash", opening_balance: 0 }); }}>
      <DialogTrigger asChild><Button><Plus /> Add account</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add account</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.from("accounts").insert(v);
          if (error) return void toast.error(error.message);
          setOpen(false); refresh();
        }}>
          <div className="space-y-1.5"><Label>Name</Label><Input required placeholder="e.g. City Bank, bKash" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Type</Label>
            <Select value={v.type} onValueChange={(t) => setV({ ...v, type: t })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="wallet">Mobile wallet</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Opening balance</Label><Input type="number" step="0.01" value={v.opening_balance} onChange={(e) => setV({ ...v, opening_balance: Number(e.target.value) })} /></div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
