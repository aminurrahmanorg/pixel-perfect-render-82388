import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Stat } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAFF_ROLES, r2, sum, todayIn, useAccounts, useExpenses, useMoney, useRefresh, useRestaurant, useStaff, useSales, type Staff } from "@/lib/data";
import { Banknote, CheckCircle2, Clock, Pencil, Plus, Trash2, Users, Wallet } from "lucide-react";
import { commission } from "@/lib/pos";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/staff")({
  head: () => ({ meta: [{ title: "Staff & Salaries — Business Manager Pro" }] }),
  component: StaffPage,
});

type StaffForm = { name: string; role: string; phone: string; salary: number; hire_date: string; active: boolean; commission_percent: number };
const empty: StaffForm = { name: "", role: "Staff", phone: "", salary: 0, hire_date: "", active: true, commission_percent: 0 };
const monthLabel = (m: string) => format(parseISO(`${m}-01`), "MMMM yyyy");

function StaffPage() {
  const { data: r } = useRestaurant();
  const { data: staff = [] } = useStaff();
  const { data: expenses = [] } = useExpenses();
  const { data: sales = [] } = useSales();
  const money = useMoney();
  const refresh = useRefresh();
  const month = todayIn(r?.time_zone).slice(0, 7);
  const [view, setView] = useState(month);
  const active = staff.filter((s) => s.active);
  const payroll = sum(active, (s) => Number(s.salary));
  const tag = `(${monthLabel(view)})`;
  const payments = expenses.filter((e) => e.staff_id);
  const paidFor = (id: string) => sum(payments.filter((e) => e.staff_id === id && (e.description ?? "").includes(tag)), (e) => Number(e.amount));
  const paidTotal = r2(sum(active, (s) => paidFor(s.id)));
  const due = r2(Math.max(0, sum(active, (s) => Math.max(0, Number(s.salary) - paidFor(s.id)))));
  async function removeStaff(id: string) {
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) { toast.error(error.message); return false; }
    refresh();
    return true;
  }
  return (
    <div>
      <PageHeader title="Staff & Salaries" subtitle={`${active.length} active team members`} action={<StaffDialog />} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active staff" value={String(active.length)} icon={Users} />
        <Stat label="Monthly payroll" value={money(payroll)} icon={Wallet} />
        <Stat label={`Paid · ${monthLabel(view)}`} value={money(paidTotal)} icon={CheckCircle2} />
        <Stat label="Still due" value={money(due)} tone={due > 0 ? "bad" : undefined} icon={Clock} />
      </div>
      <Panel>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Salary status</h3>
          <div className="flex items-center gap-2"><Label className="text-xs">Salary month</Label><Input type="month" className="w-44" value={view} onChange={(e) => e.target.value && setView(e.target.value)} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2">Name</th><th className="pb-2">Role</th><th className="pb-2">Phone</th><th className="pb-2">Status</th><th className="pb-2 text-right">Salary</th><th className="pb-2 text-right">Paid</th><th className="pb-2 text-right">Due</th><th className="pb-2 text-right">Sales · Commission</th><th /></tr>
            </thead>
            <tbody className="num">
              {staff.map((s) => {
                const paid = r2(paidFor(s.id));
                const left = r2(Math.max(0, Number(s.salary) - paid));
                return (
                <tr key={s.id} className="border-t">
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2"><span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{s.role}</span></td>
                  <td className="py-2 text-muted-foreground">{s.phone || "—"}</td>
                  <td className="py-2">{s.active ? <span className="text-primary">Active</span> : <span className="text-muted-foreground">Inactive</span>}</td>
                  <td className="py-2 text-right font-medium">{money(Number(s.salary))}</td>
                  <td className="py-2 text-right text-success">{money(paid)}</td>
                  <td className="py-2 text-right">{left === 0 ? <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">Paid</span> : <span className="text-destructive">{money(left)}</span>}</td>
                  <td className="py-2 text-right text-xs">{(() => { const c = commission(sales.filter((x) => x.salesperson_id === s.id && x.sale_date.startsWith(view)), Number(s.commission_percent)); return c.net ? <>{money(c.net)} · <b className="text-primary">{money(c.commission)}</b></> : "—"; })()}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {left > 0 && s.active && <PayDialog staff={s} month={view} amount={left} />}
                    <StaffDialog initial={s} />
                    <ConfirmActionDialog title={`Remove ${s.name}?`} description="This action cannot be undone." actionLabel="Remove staff member" pendingLabel="Removing..." onConfirm={() => removeStaff(s.id)}>
                      <Button size="icon" variant="ghost" aria-label={`Remove ${s.name}`}><Trash2 className="size-4" /></Button>
                    </ConfirmActionDialog>
                  </td>
                </tr>
              ); })}
              {staff.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No staff yet. Add your first team member.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel className="mt-4" title="Salary payment history">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Date</th><th className="pb-2">Details</th><th className="pb-2 text-right">Amount</th></tr></thead>
            <tbody className="num">
              {payments.slice(0, 50).map((e) => (
                <tr key={e.id} className="border-t"><td className="py-2">{e.expense_date}</td><td className="py-2">{e.description}</td><td className="py-2 text-right font-medium">{money(Number(e.amount))}</td></tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No salary paid yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function PayDialog({ staff, month, amount }: { staff: Staff; month: string; amount: number }) {
  const { data: r } = useRestaurant();
  const { data: accounts = [] } = useAccounts();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ amount, date: "", account: "", note: "" });
  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) setV({ amount, date: todayIn(r?.time_zone), account: accounts.find((a) => a.type === "cash")?.id ?? accounts[0]?.id ?? "", note: "" });
    }}>
      <DialogTrigger asChild><Button size="sm" className="mr-1"><Banknote /> Pay</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Pay salary — {staff.name}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const amt = r2(v.amount);
          if (!(amt > 0)) return void toast.error("Amount must be greater than 0");
          if (amt > amount) return void toast.error("Amount is more than the remaining salary");
          if (!v.account) return void toast.error("Choose a payment account");
          const { error } = await supabase.from("expenses").insert({
            expense_date: v.date, category: "Salaries", amount: amt, account_id: v.account, staff_id: staff.id,
            description: `Salary — ${staff.name} (${monthLabel(month)})${v.note ? ` · ${v.note}` : ""}`,
          });
          if (error) return void toast.error(error.message);
          toast.success(`Salary paid to ${staff.name}`);
          setOpen(false); refresh();
        }}>
          <p className="text-sm text-muted-foreground">Salary month: <b>{monthLabel(month)}</b> · remaining {amount.toFixed(2)}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Amount</Label><Input type="number" step="0.01" min="0" value={v.amount} onChange={(e) => setV({ ...v, amount: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Payment date</Label><Input type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Paid from</Label>
              <Select value={v.account} onValueChange={(c) => setV({ ...v, account: c })}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Note (optional)</Label><Input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="e.g. advance, bonus" /></div>
          </div>
          <Button type="submit" className="w-full">Record payment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StaffDialog({ initial }: { initial?: Staff }) {
  const { data: r } = useRestaurant();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<StaffForm>(empty);
  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) setV(initial ? { name: initial.name, role: initial.role, phone: initial.phone ?? "", salary: Number(initial.salary), hire_date: initial.hire_date, active: initial.active, commission_percent: Number(initial.commission_percent) } : { ...empty, hire_date: todayIn(r?.time_zone) });
    }}>
      <DialogTrigger asChild>
        {initial ? <Button size="icon" variant="ghost" aria-label="Edit"><Pencil className="size-4" /></Button> : <Button><Plus /> Add staff</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Edit staff member" : "Add staff member"}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!v.name.trim()) return void toast.error("Name is required");
          if (v.salary < 0) return void toast.error("Salary can't be negative");
          const payload = { ...v, name: v.name.trim(), phone: v.phone || null };
          const { error } = initial
            ? await supabase.from("staff").update(payload).eq("id", initial.id)
            : await supabase.from("staff").insert(payload);
          if (error) return void toast.error(error.message);
          toast.success(initial ? "Staff updated" : "Staff added");
          setOpen(false); refresh();
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Role</Label>
              <Select value={v.role} onValueChange={(c) => setV({ ...v, role: c })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAFF_ROLES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Monthly salary</Label><Input type="number" step="0.01" min="0" value={v.salary} onChange={(e) => setV({ ...v, salary: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Sales commission %</Label><Input type="number" step="0.01" min="0" max="100" value={v.commission_percent} onChange={(e) => setV({ ...v, commission_percent: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Hire date</Label><Input type="date" value={v.hire_date} onChange={(e) => setV({ ...v, hire_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={v.active ? "active" : "inactive"} onValueChange={(c) => setV({ ...v, active: c === "active" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full">{initial ? "Save changes" : "Add staff member"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
