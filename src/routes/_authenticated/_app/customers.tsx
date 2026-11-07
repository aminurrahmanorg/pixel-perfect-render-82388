import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Stat } from "@/components/PageHeader";
import { DatePickerField } from "@/components/DatePickerField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CUSTOMER_TIERS, r2, todayIn, useAccounts, useCustomerPayments, useCustomers, useMoney, useRefresh, useRestaurant, useSales, type Customer } from "@/lib/data";
import { customerDue, saleDue } from "@/lib/customers";
import { Crown, HandCoins, Pencil, Plus, Search, Star, Trash2, UserRound, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/customers")({
  head: () => ({ meta: [{ title: "Customers — Business Manager Pro" }] }),
  component: CustomersPage,
});

const blank = { name: "", phone: "", email: "", address: "", tier: "Regular", credit_limit: 0, points: 0 };

function CustomersPage() {
  const { data: customers = [] } = useCustomers();
  const { data: sales = [] } = useSales();
  const { data: payments = [] } = useCustomerPayments();
  const { data: accounts = [] } = useAccounts();
  const { data: r } = useRestaurant();
  const money = useMoney();
  const refresh = useRefresh();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<(typeof blank & { id?: string }) | null>(null);
  const [pay, setPay] = useState<Customer | null>(null);
  const [view, setView] = useState<Customer | null>(null);

  const rows = useMemo(() => customers.map((c) => {
    const mine = sales.filter((s) => s.customer_id === c.id);
    const spent = r2(mine.reduce((a, s) => a + Number(s.total), 0));
    const last = mine.reduce((m, s) => (s.sale_date > m ? s.sale_date : m), "");
    const days = last ? (Date.now() - new Date(last).getTime()) / 86400000 : 999;
    // Value score: spend weighted by visits and recency.
    const score = spent * (1 + mine.length / 10) * (days < 30 ? 1.5 : days < 90 ? 1 : 0.5);
    return { c, spent, visits: mine.length, last, due: customerDue(c.id, sales, payments), score };
  }), [customers, sales, payments]);
  const shown = rows.filter(({ c }) => `${c.name} ${c.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const totalDue = r2(rows.reduce((a, x) => a + x.due, 0));
  const top = [...rows].sort((a, b) => b.score - a.score).slice(0, 5);

  async function save() {
    if (!edit?.name.trim()) return void toast.error("Name is required");
    const { id, ...v } = edit;
    const row = { ...v, phone: v.phone || null, email: v.email || null, address: v.address || null };
    const { error } = id ? await supabase.from("customers").update(row).eq("id", id) : await supabase.from("customers").insert(row);
    if (error) return void toast.error(error.message);
    toast.success("Customer saved"); setEdit(null); refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) { toast.error(error.message); return false; }
    refresh();
    return true;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle="Members, loyalty points, dues and repayments" action={<Button onClick={() => setEdit({ ...blank })}><Plus /> Add customer</Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Customers" value={String(customers.length)} icon={Users} color={0} />
        <Stat label="Total due" value={money(totalDue)} icon={Wallet} color={4} />
        <Stat label="Repayments collected" value={money(r2(payments.reduce((a, p) => a + Number(p.amount), 0)))} icon={HandCoins} color={2} />
        <Stat label="Points outstanding" value={String(Math.round(customers.reduce((a, c) => a + Number(c.points), 0)))} icon={Star} color={3} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="All customers">
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Customer</th><th>Tier</th><th className="text-right">Points</th><th className="text-right">Spent</th><th className="text-right">Due</th><th /></tr></thead>
              <tbody>
                {shown.map(({ c, spent, due }) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2"><button className="text-left font-medium hover:text-primary" onClick={() => setView(c)}>{c.name}</button><p className="text-xs text-muted-foreground">{c.phone}</p></td>
                    <td><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{c.tier}</span></td>
                    <td className="num text-right">{Math.round(Number(c.points))}</td>
                    <td className="num text-right">{money(spent)}</td>
                    <td className={`num text-right font-semibold ${due > 0 ? "text-destructive" : ""}`}>{money(due)}</td>
                    <td className="whitespace-nowrap text-right">
                      {due > 0 && <Button size="sm" variant="outline" onClick={() => setPay(c)}>Collect</Button>}
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEdit({ id: c.id, name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", tier: c.tier, credit_limit: Number(c.credit_limit), points: Number(c.points) })}><Pencil /></Button>
                      <ConfirmActionDialog title="Delete this customer?" description="Their past sales will stay." actionLabel="Delete customer" onConfirm={() => remove(c.id)}>
                        <Button size="icon" variant="ghost" aria-label="Delete"><Trash2 /></Button>
                      </ConfirmActionDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No customers yet.</p>}
          </div>
        </Panel>
        <Panel title="Valued customers">
          <ol className="space-y-3">
            {top.filter((t) => t.spent > 0).map((t, i) => (
              <li key={t.c.id} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">{i === 0 ? <Crown className="size-4" /> : <UserRound className="size-4" />}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.c.name}</p><p className="text-xs text-muted-foreground">{t.visits} visits · last {t.last || "—"}</p></div>
                <span className="num text-sm font-semibold">{money(t.spent)}</span>
              </li>
            ))}
            {top.every((t) => t.spent === 0) && <p className="text-sm text-muted-foreground">Select customers on POS sales to rank them here.</p>}
          </ol>
        </Panel>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit customer" : "Add customer"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2"><Label>Name</Label><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email</Label><Input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Address</Label><Input value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></div>
              <div className="space-y-1"><Label>Membership</Label>
                <Select value={edit.tier} onValueChange={(t) => setEdit({ ...edit, tier: t })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CUSTOMER_TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1"><Label>Credit limit (0 = no limit)</Label><Input type="number" min={0} value={edit.credit_limit} onChange={(e) => setEdit({ ...edit, credit_limit: Number(e.target.value) })} /></div>
              <Button className="sm:col-span-2" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PayDialog customer={pay} onClose={() => setPay(null)} due={pay ? customerDue(pay.id, sales, payments) : 0} accounts={accounts} today={todayIn(r?.time_zone)} />

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{view?.name}</DialogTitle></DialogHeader>
          {view && (() => {
            const x = rows.find((t) => t.c.id === view.id)!;
            const hist = sales.filter((s) => s.customer_id === view.id).slice(0, 15);
            const reps = payments.filter((p) => p.customer_id === view.id);
            return (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-secondary p-2"><p className="text-xs text-muted-foreground">Lifetime</p><p className="num font-semibold">{money(x.spent)}</p></div>
                  <div className="rounded-lg bg-secondary p-2"><p className="text-xs text-muted-foreground">Due</p><p className="num font-semibold text-destructive">{money(x.due)}</p></div>
                  <div className="rounded-lg bg-secondary p-2"><p className="text-xs text-muted-foreground">Points</p><p className="num font-semibold">{Math.round(Number(view.points))}</p></div>
                </div>
                <div><p className="mb-1 font-semibold">Purchases</p>{hist.map((s) => <div key={s.id} className="flex justify-between border-t py-1"><span>{s.sale_date}</span><span className="num">{money(Number(s.total))}{saleDue(s) > 0 && <span className="ml-2 text-destructive">due {money(saleDue(s))}</span>}</span></div>)}{!hist.length && <p className="text-muted-foreground">None yet</p>}</div>
                <div><p className="mb-1 font-semibold">Repayments</p>{reps.map((p) => <div key={p.id} className="flex justify-between border-t py-1"><span>{p.payment_date}</span><span className="num">{money(Number(p.amount))}</span></div>)}{!reps.length && <p className="text-muted-foreground">None yet</p>}</div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayDialog({ customer, onClose, due, accounts, today }: { customer: Customer | null; onClose: () => void; due: number; accounts: { id: string; name: string }[]; today: string }) {
  const refresh = useRefresh();
  const money = useMoney();
  const [amount, setAmount] = useState(0);
  const [account, setAccount] = useState("");
  const [date, setDate] = useState("");
  async function save() {
    if (!customer) return;
    if (amount <= 0) return void toast.error("Enter an amount");
    if (amount > due) return void toast.error(`Can't collect more than the due (${money(due)})`);
    if (!account) return void toast.error("Choose the account that received it");
    const { error } = await supabase.from("customer_payments").insert({ customer_id: customer.id, amount: r2(amount), account_id: account, payment_date: date || today });
    if (error) return void toast.error(error.message);
    toast.success("Repayment recorded"); setAmount(0); onClose(); refresh();
  }
  return (
    <Dialog open={!!customer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Collect due — {customer?.name}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Current due: <span className="num font-semibold text-foreground">{money(due)}</span></p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Amount</Label><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
          <DatePickerField label="Date" value={date || today} onChange={setDate} />
          <div className="space-y-1 sm:col-span-2"><Label>Received into</Label>
            <Select value={account} onValueChange={setAccount}><SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger><SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button className="sm:col-span-2" onClick={save}>Record repayment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
