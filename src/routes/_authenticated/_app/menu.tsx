import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useMenuItems, useMoney, useProductCategories, useRefresh, type MenuItem } from "@/lib/data";
import { Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { aiProductFromPhoto } from "@/lib/ai.functions";
import { ImageUpload } from "@/components/ImageUpload";

export const Route = createFileRoute("/_authenticated/_app/menu")({
  head: () => ({ meta: [{ title: "Products — Business Manager Pro" }] }),
  component: MenuPage,
});

function MenuPage() {
  const { data: items = [] } = useMenuItems();
  const { data: categories = [] } = useProductCategories();
  const money = useMoney();
  const refresh = useRefresh();
  async function deleteProduct(id: string) {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return false; }
    refresh();
    return true;
  }
  return (
    <div>
      <PageHeader title="Products" subtitle="Selling price, cost and margin for each product" action={<div className="flex gap-2"><Button asChild variant="outline"><Link to="/categories">Manage categories</Link></Button><ItemDialog /></div>} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2">Item</th><th className="pb-2">Category</th><th className="pb-2 text-right">Disc.</th><th className="pb-2 text-right">VAT</th><th className="pb-2 text-right">Price</th><th className="pb-2 text-right">Cost</th><th className="pb-2 text-right">Margin</th><th className="pb-2 text-right">Stock</th><th className="pb-2">Status</th><th /></tr>
            </thead>
            <tbody className="num">
              {items.map((m) => {
                const p = Number(m.price), c = Number(m.cost);
                const margin = p ? ((p - c) / p) * 100 : 0;
                return (
                  <tr key={m.id} className="border-t">
                    <td className="py-2 font-medium"><div className="flex items-center gap-2">{m.image_url ? <img src={m.image_url} alt={m.name} className="size-9 rounded object-cover" /> : <div className="size-9 rounded bg-muted" />}{m.name}</div></td>
                    <td className="py-2 text-muted-foreground">{m.brand ? `${m.brand} · ` : ""}{m.category}</td>
                    <td className="py-2 text-right">{Number(m.discount_percent) > 0 ? `${Number(m.discount_percent)}%` : "—"}</td>
                    <td className="py-2 text-right">{m.tax_percent != null ? `${Number(m.tax_percent)}%` : "Store"}</td>
                    <td className="py-2 text-right">{money(p)}</td>
                    <td className="py-2 text-right">{money(c)}</td>
                    <td className={`py-2 text-right font-medium ${margin < 30 ? "text-destructive" : "text-success"}`}>{margin.toFixed(0)}%</td>
                    <td className={`py-2 text-right ${m.track_stock && Number(m.stock_qty) <= Number(m.low_stock_at) ? "font-semibold text-destructive" : ""}`}>{m.track_stock ? Number(m.stock_qty) : "—"}</td>
                    <td className="py-2">{m.active ? "Active" : "Hidden"}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <ItemDialog item={m} />
                      <ConfirmActionDialog title={`Delete ${m.name}?`} description="This action cannot be undone." actionLabel="Delete product" onConfirm={() => deleteProduct(m.id)}>
                        <Button size="icon" variant="ghost" aria-label={`Delete ${m.name}`}><Trash2 className="size-4" /></Button>
                      </ConfirmActionDialog>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

type Form = { name: string; category: string; brand: string | null; price: number; cost: number; active: boolean; image_url: string | null; discount_percent: number; tax_percent: number | null; sku: string | null; barcode: string | null; track_stock: boolean; stock_qty?: number; low_stock_at: number };
const empty: Form = { name: "", category: "General", brand: null, price: 0, cost: 0, active: true, image_url: null, discount_percent: 0, tax_percent: null, sku: null, barcode: null, track_stock: false, stock_qty: 0, low_stock_at: 5 };

function ItemDialog({ item }: { item?: MenuItem }) {
  const refresh = useRefresh();
  const { data: categories = [] } = useProductCategories();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Form>(empty);
  useEffect(() => {
    const firstCategory = categories[0]?.name;
    if (open && !item && !v.category && firstCategory) {
      setV((current) => ({ ...current, category: firstCategory }));
    }
  }, [categories, item, open, v.category]);
  const identify = useServerFn(aiProductFromPhoto);
  const [aiBusy, setAiBusy] = useState(false);
  async function fromPhoto(file: File) {
    if (file.size > 5 * 1024 * 1024) return void toast.error("Photo must be under 5 MB");
    setAiBusy(true);
    try {
      const image = await new Promise<string>((ok, bad) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.onerror = bad; fr.readAsDataURL(file); });
      const r = await identify({ data: { image } });
      if (r.error || !r.product) return void toast.error(r.error ?? "Couldn't recognise it");
      const p = r.product;
      const category = categories.find((c) => c.name.toLowerCase() === p.category?.toLowerCase())?.name;
      setV((x) => ({ ...x, name: p.name || x.name, category: category ?? x.category, brand: p.brand ?? x.brand, barcode: p.barcode ?? x.barcode, price: p.price || x.price }));
      toast.success("Filled from photo — check and save");
    } catch { toast.error("AI couldn't read the photo"); } finally { setAiBusy(false); }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) setV(item ? { name: item.name, category: item.category, brand: item.brand, price: Number(item.price), cost: Number(item.cost), active: item.active, image_url: item.image_url, discount_percent: Number(item.discount_percent ?? 0), tax_percent: item.tax_percent, sku: item.sku, barcode: item.barcode, track_stock: item.track_stock, low_stock_at: Number(item.low_stock_at) } : { ...empty, category: categories[0]?.name ?? "" });
    }}>
      <DialogTrigger asChild>
        {item ? <Button size="icon" variant="ghost" aria-label="Edit"><Pencil className="size-4" /></Button> : <Button><Plus /> Add item</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle>{item ? "Edit item" : "Add product"}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!v.category) return void toast.error("Add a category before saving a product");
          if (v.price < 0 || v.cost < 0) return void toast.error("Prices can't be negative");
          if (v.discount_percent < 0 || v.discount_percent > 100) return void toast.error("Discount must be 0–100%");
          const { stock_qty: opening = 0, ...rest } = v;
          const { data: saved, error } = item
            ? await supabase.from("menu_items").update(rest).eq("id", item.id).select().single()
            : await supabase.from("menu_items").insert(rest).select().single();
          if (error) return void toast.error(error.message);
          if (!item && v.track_stock && opening > 0) {
            const { error: stockError } = await supabase.from("stock_moves").insert({ owner_id: saved.owner_id, menu_item_id: saved.id, qty: opening, kind: "opening", unit_cost: v.cost });
            if (stockError) {
              toast.error(`Product saved, but opening stock could not be recorded: ${stockError.message}`);
              setOpen(false);
              refresh();
              return;
            }
          }
          setOpen(false); refresh();
        }}>
          <div className="space-y-1.5"><Label>Photo</Label><ImageUpload value={v.image_url} onChange={(u) => setV({ ...v, image_url: u })} /></div>
          {!item && <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-primary/50 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {aiBusy ? "Reading photo…" : "Fill details from a product photo (AI)"}
            <input type="file" accept="image/*" capture="environment" className="hidden" disabled={aiBusy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void fromPhoto(f); e.target.value = ""; }} />
          </label>}
          <div className="space-y-1.5"><Label>Name</Label><Input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={v.category} onValueChange={(category) => setV({ ...v, category })}>
                <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
              {categories.length === 0 && <p className="text-xs text-muted-foreground">Add a category first from <Link className="text-primary underline" to="/categories">Categories</Link>.</p>}
            </div>
            <div className="space-y-1.5"><Label>Brand</Label><Input placeholder="Optional" value={v.brand ?? ""} onChange={(e) => setV({ ...v, brand: e.target.value || null })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Selling price</Label><Input type="number" step="0.01" value={v.price} onChange={(e) => setV({ ...v, price: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Product cost</Label><Input type="number" step="0.01" value={v.cost} onChange={(e) => setV({ ...v, cost: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Item discount %</Label><Input type="number" min={0} max={100} step="0.01" value={v.discount_percent} onChange={(e) => setV({ ...v, discount_percent: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Item VAT % (empty = store rate)</Label><Input type="number" min={0} step="0.01" value={v.tax_percent ?? ""} onChange={(e) => setV({ ...v, tax_percent: e.target.value === "" ? null : Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>SKU</Label><Input value={v.sku ?? ""} onChange={(e) => setV({ ...v, sku: e.target.value || null })} /></div>
            <div className="space-y-1.5"><Label>Barcode</Label><Input placeholder="Scan or type" value={v.barcode ?? ""} onChange={(e) => setV({ ...v, barcode: e.target.value || null })} /></div>
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <label className="flex items-center gap-2 pb-2 text-sm"><Switch checked={v.track_stock} onCheckedChange={(c) => setV({ ...v, track_stock: c })} /> Track stock</label>
            {v.track_stock && <div className="space-y-1.5"><Label>Low-stock alert at</Label><Input type="number" min={0} value={v.low_stock_at} onChange={(e) => setV({ ...v, low_stock_at: Number(e.target.value) })} /></div>}
          </div>
          {v.track_stock && !item && <div className="space-y-1.5"><Label>Opening stock</Label><Input type="number" min={0} value={v.stock_qty ?? 0} onChange={(e) => setV({ ...v, stock_qty: Number(e.target.value) })} /></div>}
          <label className="flex items-center gap-2 text-sm"><Switch checked={v.active} onCheckedChange={(c) => setV({ ...v, active: c })} /> Available for sale</label>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
