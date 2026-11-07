import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcTax, r2, todayIn, useAccounts, useMenuItems, useMoney, useRefresh, useRestaurant, useSales } from "@/lib/data";
import { ReturnDialog } from "@/components/ReturnDialog";
import { FileText, Plus, Printer, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/sales")({
  head: () => ({ meta: [{ title: "Sales — Business Manager Pro" }] }),
  component: SalesPage,
});

function SalesPage() {
  const { data: sales = [] } = useSales();
  const { data: accounts = [] } = useAccounts();
  const money = useMoney();
  const refresh = useRefresh();
  const [q, setQ] = useState("");
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null);
  const [deletingSale, setDeletingSale] = useState(false);
  const acc = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? "—";
  const list = sales.filter((s) => !q || s.sale_date.includes(q) || (s.customer ?? "").toLowerCase().includes(q.toLowerCase()));

  async function deleteSale(id: string) {
    setDeletingSale(true);
    const { error } = await supabase.from("sales").delete().eq("id", id);
    setDeletingSale(false);
    if (error) return void toast.error(error.message);
    setDeleteSaleId(null);
    refresh();
  }

  return (
    <div>
      <PageHeader title="Sales" subtitle={`${sales.length} sales recorded`} action={<div className="flex gap-2"><Button asChild><Link to="/pos"><Plus /> New sale</Link></Button><NewSale /></div>} />
      <Panel>
        <Input placeholder="Search by date (2026-10) or customer" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2">Date</th><th className="pb-2">Customer</th><th className="pb-2">Paid to</th><th className="pb-2 text-right">Total</th><th className="pb-2 text-right">Product cost</th><th /></tr>
            </thead>
            <tbody className="num">
              {list.slice(0, 300).map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2">{s.sale_date}</td>
                  <td className="py-2">{s.customer || "Walk-in"}</td>
                  <td className="py-2">{acc(s.account_id)}</td>
                  <td className="py-2 text-right font-medium">{money(Number(s.total))}</td>
                  <td className="py-2 text-right text-muted-foreground">{money(Number(s.cost_total))}</td>
                  <td className="whitespace-nowrap py-2 text-right">
                    <Button asChild size="icon" variant="ghost" aria-label="Print receipt"><Link to="/print/$saleId" params={{ saleId: s.id }} search={{ type: "receipt" }} target="_blank"><Printer className="size-4" /></Link></Button>
                    <Button asChild size="icon" variant="ghost" aria-label="Print invoice"><Link to="/print/$saleId" params={{ saleId: s.id }} search={{ type: "invoice" }} target="_blank"><FileText className="size-4" /></Link></Button>
                    <ReturnDialog sale={s} />
                    <Button size="icon" variant="ghost" aria-label="Delete sale" onClick={() => setDeleteSaleId(s.id)}><Trash2 className="size-4" /></Button>
                    <AlertDialog open={deleteSaleId === s.id} onOpenChange={(open) => { if (!open && !deletingSale) setDeleteSaleId(null); }}>
                      <AlertDialogContent className="max-w-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletingSale}>Cancel</AlertDialogCancel>
                          <Button variant="destructive" disabled={deletingSale} onClick={() => void deleteSale(s.id)}>{deletingSale ? "Deleting..." : "Delete sale"}</Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No sales found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

type Line = { menu_item_id: string; qty: number };

function NewSale() {
  const { data: r } = useRestaurant();
  const { data: menu = [] } = useMenuItems();
  const { data: accounts = [] } = useAccounts();
  const money = useMoney();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [account, setAccount] = useState("");
  const [date, setDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [busy, setBusy] = useState(false);

  const active = menu.filter((m) => m.active);
  const get = (id: string) => menu.find((m) => m.id === id);
  const subtotal = lines.reduce((a, l) => a + l.qty * Number(get(l.menu_item_id)?.price ?? 0), 0);
  const { tax, total, label: taxLabel } = calcTax(subtotal - discount, r);

  function reset() {
    setLines([]); setCustomer(""); setDiscount(0);
    setDate(todayIn(r?.time_zone));
    setAccount(accounts.find((a) => a.type === "cash")?.id ?? accounts[0]?.id ?? "");
  }

  async function save() {
    if (lines.length === 0) return void toast.error("Add at least one item");
    if (discount < 0 || discount > subtotal) return void toast.error("Discount must be between 0 and the subtotal");
    setBusy(true);
    const cost = r2(lines.reduce((a, l) => a + l.qty * Number(get(l.menu_item_id)?.cost ?? 0), 0));
    const { data: sale, error } = await supabase.from("sales").insert({
      sale_date: date, account_id: account || null, customer: customer || null, discount, tax, total, cost_total: cost,
    }).select().single();
    if (error) { setBusy(false); return void toast.error(error.message); }
    const { error: e2 } = await supabase.from("sale_items").insert(lines.map((l) => {
      const m = get(l.menu_item_id)!;
      return { sale_id: sale.id, menu_item_id: m.id, name: m.name, qty: l.qty, price: m.price, cost: m.cost };
    }));
    setBusy(false);
    if (e2) return void toast.error(e2.message);
    toast.success("Sale recorded", {
      action: { label: "Print receipt", onClick: () => window.open(`/print/${sale.id}?type=receipt`, "_blank") },
    });
    setOpen(false);
    refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
      <DialogTrigger asChild><Button variant="outline" className="hidden sm:inline-flex">Quick entry</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>New sale</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {active.map((m) => (
              <Button key={m.id} type="button" variant="secondary" size="sm" onClick={() => setLines((ls) => {
                const ex = ls.find((l) => l.menu_item_id === m.id);
                return ex ? ls.map((l) => l === ex ? { ...l, qty: l.qty + 1 } : l) : [...ls, { menu_item_id: m.id, qty: 1 }];
              })}>{m.image_url && <img src={m.image_url} alt="" className="size-5 rounded object-cover" />}{m.name}</Button>
            ))}
            {active.length === 0 && <p className="text-sm text-muted-foreground">Add products first.</p>}
          </div>
          {lines.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              {lines.map((l, i) => {
                const m = get(l.menu_item_id)!;
                return (
                  <div key={l.menu_item_id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">{m.name}</span>
                    <Input type="number" min={1} className="h-8 w-16" value={l.qty} onChange={(e) => setLines((ls) => ls.map((x, j) => j === i ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x))} />
                    <span className="num w-24 text-right">{money(l.qty * Number(m.price))}</span>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><X className="size-3" /></Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Paid to</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Customer (optional)</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Discount</Label><Input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
          </div>
          <div className="num space-y-1 rounded-lg bg-secondary p-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{money(discount)}</span></div>}
            {taxLabel && <div className="flex justify-between"><span>{taxLabel}</span><span>{money(tax)}</span></div>}
            <div className="flex justify-between font-semibold"><span>Total</span><span>{money(total)}</span></div>
          </div>
          <Button className="w-full" disabled={busy} onClick={save}>Save sale</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
