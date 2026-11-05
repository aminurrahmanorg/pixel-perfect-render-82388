import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAll, r2, todayIn, useAccounts, useMenuItems, useMoney, useRefresh, useRestaurant } from "@/lib/data";
import type { Tables } from "@/integrations/supabase/types";
import { AlertTriangle, Boxes, PackagePlus } from "lucide-react";
import { toast } from "sonner";

type Move = Tables<"stock_moves">;
export const useStockMoves = () => useQuery({ queryKey: ["stock_moves"], queryFn: () => fetchAll<Move>("stock_moves", "created_at") });

export const Route = createFileRoute("/_authenticated/_app/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Business Manager Pro" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const { data: items = [] } = useMenuItems();
  const { data: moves = [] } = useStockMoves();
  const money = useMoney();
  const tracked = items.filter((m) => m.track_stock);
  const low = tracked.filter((m) => Number(m.stock_qty) <= Number(m.low_stock_at));
  const value = r2(tracked.reduce((a, m) => a + Math.max(0, Number(m.stock_qty)) * Number(m.cost), 0));
  const name = (id: string) => items.find((m) => m.id === id)?.name ?? "—";
  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Stock levels, low-stock alerts and purchases" action={<StockInDialog />} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel><p className="text-sm text-muted-foreground">Tracked products</p><p className="num text-2xl font-semibold">{tracked.length}</p></Panel>
        <Panel><p className="text-sm text-muted-foreground">Stock value (at cost)</p><p className="num text-2xl font-semibold">{money(value)}</p></Panel>
        <Panel><p className="flex items-center gap-1 text-sm text-muted-foreground"><AlertTriangle className="size-4 text-destructive" /> Low stock</p><p className="num text-2xl font-semibold text-destructive">{low.length}</p></Panel>
      </div>
      <Panel title="Stock levels">
        {tracked.length === 0 && <p className="py-4 text-sm text-muted-foreground">Turn on "Track stock" for a product on the Products page to see it here.</p>}
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Product</th><th className="pb-2">SKU / Barcode</th><th className="pb-2 text-right">In stock</th><th className="pb-2 text-right">Alert at</th><th className="pb-2">Status</th></tr></thead>
          <tbody className="num">{tracked.map((m) => {
            const q = Number(m.stock_qty), isLow = q <= Number(m.low_stock_at);
            return <tr key={m.id} className="border-t"><td className="py-2 font-medium">{m.name}</td><td className="py-2 text-muted-foreground">{[m.sku, m.barcode].filter(Boolean).join(" · ") || "—"}</td><td className="py-2 text-right font-semibold">{q}</td><td className="py-2 text-right">{Number(m.low_stock_at)}</td><td className="py-2">{q <= 0 ? <span className="font-semibold text-destructive">Out of stock</span> : isLow ? <span className="font-semibold text-warning">Low — reorder</span> : <span className="text-success">OK</span>}</td></tr>;
          })}</tbody>
        </table></div>
      </Panel>
      <Panel title="Stock ledger">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Date</th><th className="pb-2">Product</th><th className="pb-2">Type</th><th className="pb-2">Supplier / note</th><th className="pb-2 text-right">Qty</th></tr></thead>
          <tbody className="num">{[...moves].reverse().slice(0, 100).map((x) => (
            <tr key={x.id} className="border-t"><td className="py-2">{x.move_date}</td><td className="py-2">{name(x.menu_item_id)}</td><td className="py-2 capitalize">{x.kind}</td><td className="py-2 text-muted-foreground">{[x.supplier, x.note].filter(Boolean).join(" · ") || "—"}</td><td className={`py-2 text-right font-semibold ${Number(x.qty) < 0 ? "text-destructive" : "text-success"}`}>{Number(x.qty) > 0 ? "+" : ""}{Number(x.qty)}</td></tr>
          ))}{moves.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground"><Boxes className="mx-auto mb-1 size-6" />No stock movements yet.</td></tr>}</tbody>
        </table></div>
      </Panel>
    </div>
  );
}

function StockInDialog() {
  const { data: items = [] } = useMenuItems();
  const { data: accounts = [] } = useAccounts();
  const { data: r } = useRestaurant();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ item: "", qty: 1, unit_cost: 0, supplier: "", kind: "purchase", account: "none" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><PackagePlus /> Stock in / adjust</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add stock movement</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!v.item) return void toast.error("Choose a product");
          if (!v.qty) return void toast.error("Quantity can't be 0");
          const product = items.find((m) => m.id === v.item);
          if (!product) return void toast.error("Selected product could not be found");
          const qty = v.kind === "purchase" ? Math.abs(v.qty) : v.qty;
          const { error } = await supabase.from("stock_moves").insert({ owner_id: product.owner_id, menu_item_id: product.id, qty, kind: v.kind, unit_cost: v.unit_cost, supplier: v.supplier || null, move_date: todayIn(r?.time_zone) });
          if (error) return void toast.error(error.message);
          await supabase.from("menu_items").update({ track_stock: true }).eq("id", v.item);
          if (v.kind === "purchase" && v.account !== "none" && v.unit_cost > 0) {
            const { error: e2 } = await supabase.from("expenses").insert({ category: "Stock purchase", amount: r2(qty * v.unit_cost), account_id: v.account, expense_date: todayIn(r?.time_zone), description: `${items.find((m) => m.id === v.item)?.name} ×${qty}${v.supplier ? ` from ${v.supplier}` : ""}` });
            if (e2) toast.error(e2.message);
          }
          toast.success("Stock updated"); setOpen(false); setV({ ...v, qty: 1, supplier: "" }); refresh();
        }}>
          <div className="space-y-1.5"><Label>Product</Label>
            <Select value={v.item} onValueChange={(x) => setV({ ...v, item: x, unit_cost: Number(items.find((m) => m.id === x)?.cost ?? 0) })}><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent>{items.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Type</Label>
              <Select value={v.kind} onValueChange={(x) => setV({ ...v, kind: x })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="purchase">Purchase (stock in)</SelectItem><SelectItem value="adjustment">Adjustment (+/−)</SelectItem><SelectItem value="damage">Damage / loss (−)</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" step="any" value={v.qty} onChange={(e) => setV({ ...v, qty: v.kind === "damage" ? -Math.abs(Number(e.target.value)) : Number(e.target.value) })} /></div>
          </div>
          {v.kind === "purchase" && <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Unit cost</Label><Input type="number" step="0.01" value={v.unit_cost} onChange={(e) => setV({ ...v, unit_cost: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Supplier</Label><Input value={v.supplier} onChange={(e) => setV({ ...v, supplier: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Paid from (records an expense)</Label>
              <Select value={v.account} onValueChange={(x) => setV({ ...v, account: x })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Don't record payment</SelectItem>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
            </div>
          </>}
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
