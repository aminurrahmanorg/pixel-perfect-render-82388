import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { todayIn, useMoney, useRefresh, useRestaurant, type Sale } from "@/lib/data";
import { applyReturn } from "@/lib/pos";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";

export function ReturnDialog({ sale }: { sale: Sale }) {
  const { data: r } = useRestaurant();
  const money = useMoney();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [restock, setRestock] = useState(true);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["sale_items", sale.id], enabled: open, queryFn: async () => (await supabase.from("sale_items").select("*").eq("sale_id", sale.id)).data ?? [] });
  const chosen = items.filter((i) => (qty[i.id] ?? 0) > 0);
  const calc = applyReturn(
    { total: Number(sale.total), tax: Number(sale.tax), cost_total: Number(sale.cost_total), paid_amount: sale.paid_amount == null ? null : Number(sale.paid_amount) },
    items.map((i) => ({ price: Number(i.price), qty: Number(i.qty) })),
    chosen.map((i) => ({ price: Number(i.price), qty: qty[i.id]!, cost: restock ? Number(i.cost) : 0 })),
  );

  async function save() {
    if (!chosen.length) return void toast.error("Choose at least one item to return");
    for (const i of chosen) if (qty[i.id]! > Number(i.qty)) return void toast.error(`Only ${Number(i.qty)} × ${i.name} were sold`);
    setBusy(true);
    const ratio = calc.refund / Math.max(0.0001, chosen.reduce((a, i) => a + qty[i.id]! * Number(i.price), 0));
    const { error } = await supabase.from("sale_returns").insert(chosen.map((i) => ({
      sale_id: sale.id, menu_item_id: i.menu_item_id, name: i.name, qty: qty[i.id]!, refund: Math.round(qty[i.id]! * Number(i.price) * ratio * 100) / 100,
      cost: Number(i.cost), account_id: sale.account_id, restock, reason: reason || null, return_date: todayIn(r?.time_zone),
    })));
    if (error) { setBusy(false); return void toast.error(error.message); }
    for (const i of chosen) {
      const left = Number(i.qty) - qty[i.id]!;
      await (left > 0 ? supabase.from("sale_items").update({ qty: left }).eq("id", i.id) : supabase.from("sale_items").delete().eq("id", i.id));
    }
    const { error: e2 } = await supabase.from("sales").update({ total: calc.total, tax: calc.tax, cost_total: calc.cost_total, paid_amount: calc.paid_amount }).eq("id", sale.id);
    setBusy(false);
    if (e2) return void toast.error(e2.message);
    toast.success(`Return saved · give back ${money(calc.cashBack)}`);
    setOpen(false); setQty({}); refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="icon" variant="ghost" aria-label="Return items"><Undo2 className="size-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Return items · {sale.sale_date}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-lg border p-2 text-sm">
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{i.name}</p><p className="num text-xs text-muted-foreground">sold {Number(i.qty)} × {money(Number(i.price))}</p></div>
              <Input className="h-9 w-20" type="number" min={0} max={Number(i.qty)} value={qty[i.id] ?? 0} onChange={(e) => setQty({ ...qty, [i.id]: Math.max(0, Number(e.target.value)) })} aria-label={`Return qty ${i.name}`} />
            </div>
          ))}
          {isLoading && <p className="text-sm text-muted-foreground">Loading items…</p>}
          {!isLoading && items.length === 0 && <p className="text-sm text-muted-foreground">No items on this sale.</p>}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={restock} onChange={(e) => setRestock(e.target.checked)} /> Put items back in stock</label>
        <div className="space-y-1.5"><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" /></div>
        <div className="num space-y-1 rounded-lg bg-secondary p-3 text-sm">
          <div className="flex justify-between"><span>Refund value</span><b>{money(calc.refund)}</b></div>
          <div className="flex justify-between"><span>Cash to give back</span><b>{money(calc.cashBack)}</b></div>
          <div className="flex justify-between text-muted-foreground"><span>New sale total</span><span>{money(calc.total)}</span></div>
        </div>
        <Button className="w-full" disabled={busy || !chosen.length} onClick={save}>Confirm return</Button>
      </DialogContent>
    </Dialog>
  );
}
