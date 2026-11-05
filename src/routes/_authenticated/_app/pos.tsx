import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { expectedCash } from "@/lib/pos";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { r2, todayIn, useAccounts, useCustomerPayments, useCustomers, useMenuItems, useMoney, useProductCategories, useRefresh, useRestaurant, useSales, useStaff, type MenuItem } from "@/lib/data";
import { calcCart } from "@/lib/pricing";
import { customerDue, earnPoints, redeemValue } from "@/lib/customers";
import { Minus, Plus, Search, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/pos")({
  head: () => ({ meta: [{ title: "Point of Sale — Business Manager Pro" }] }),
  component: PosPage,
});

type Line = { id: string; qty: number; dType?: "pct" | "amt"; dVal?: number };

function PosPage() {
  const { data: r } = useRestaurant();
  const { data: menu = [] } = useMenuItems();
  const { data: productCategories = [] } = useProductCategories();
  const { data: accounts = [] } = useAccounts();
  const money = useMoney();
  const refresh = useRefresh();
  const [lines, setLines] = useState<Line[]>([]);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("");
  const { data: customers = [] } = useCustomers();
  const { data: allSales = [] } = useSales();
  const { data: custPayments = [] } = useCustomerPayments();
  const [customerId, setCustomerId] = useState("walkin");
  const [paid, setPaid] = useState<string>("");
  const [usePoints, setUsePoints] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(false);
  const { data: staff = [] } = useStaff();
  const [seller, setSeller] = useState("none");
  const { data: shift, refetch: refetchShift } = useQuery({ queryKey: ["open_shift"], queryFn: async () => (await supabase.from("shifts").select("*").is("closed_at", null).order("opened_at", { ascending: false }).limit(1).maybeSingle()).data });

  useEffect(() => {
    if (!account && accounts.length) setAccount(accounts.find((a) => a.type === "cash")?.id ?? accounts[0]?.id ?? "");
  }, [accounts, account]);

  const active = menu.filter((m) => m.active);
  const cats = useMemo(() => ["All", ...Array.from(new Set([...productCategories.map((c) => c.name), ...active.map((m) => m.category)]))], [active, productCategories]);
  const shown = active.filter((m) => (cat === "All" || m.category === cat) && `${m.name} ${m.brand ?? ""} ${m.sku ?? ""} ${m.barcode ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const get = (id: string) => menu.find((m) => m.id === id);
  const cartLines = lines.map((l) => { const m = get(l.id); return { price: Number(m?.price ?? 0), qty: l.qty, discount_percent: l.dType === "pct" ? Number(l.dVal ?? 0) : Number(m?.discount_percent ?? 0), discount_amount: l.dType === "amt" ? Number(l.dVal ?? 0) : null, tax_percent: m?.tax_percent ?? null }; });
  const lineNet = (l: Line) => calcCart([cartLines[lines.indexOf(l)]!], 0, null, false).total;
  const setDisc = (id: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const pre = calcCart(cartLines, 0, r, false);
  const subtotal = pre.subtotal;
  const itemDiscount = pre.itemDiscount;
  const [applyTax, setApplyTax] = useState(true);
  const cust = customers.find((c) => c.id === customerId);
  const pointValue = Number(r?.point_value ?? 0);
  const redeem = usePoints && cust ? redeemValue(Number(cust.points), Number(cust.points), pointValue, pre.total - discount) : { value: 0, used: 0 };
  const totalDiscount = r2(itemDiscount + discount + redeem.value);
  const { tax, total, label: taxLabel } = calcCart(cartLines, discount + redeem.value, r, applyTax);
  const paidNum = paid === "" ? total : r2(Math.max(0, Number(paid)));
  const due = r2(Math.max(0, total - paidNum));
  const prevDue = cust ? customerDue(cust.id, allSales, custPayments) : 0;
  const count = lines.reduce((a, l) => a + l.qty, 0);

  const add = (m: MenuItem) => {
    const inCart = lines.find((l) => l.id === m.id)?.qty ?? 0;
    if (m.track_stock && inCart + 1 > Number(m.stock_qty)) return void toast.error(`Only ${Number(m.stock_qty)} ${m.name} in stock`);
    addLine(m);
  };
  const scan = () => {
    const code = q.trim().toLowerCase();
    if (!code) return;
    const m = active.find((x) => x.barcode?.toLowerCase() === code || x.sku?.toLowerCase() === code);
    if (m) { add(m); setQ(""); } else if (shown.length === 1) { add(shown[0]!); setQ(""); }
  };
  const addLine = (m: MenuItem) => setLines((ls) => {
    const ex = ls.find((l) => l.id === m.id);
    return ex ? ls.map((l) => (l.id === m.id ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { id: m.id, qty: 1 }];
  });
  const setQty = (id: string, qty: number) => setLines((ls) => (qty <= 0 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, qty } : l))));
  const clear = () => { setLines([]); setCustomerId("walkin"); setDiscount(0); setPaid(""); setUsePoints(false); };

  async function openShift() {
    const v = prompt("Opening cash in drawer", "0");
    if (v === null) return;
    const { error } = await supabase.from("shifts").insert({ opening_cash: Math.max(0, Number(v) || 0) });
    if (error) return void toast.error(error.message);
    toast.success("Shift opened"); refetchShift();
  }
  async function closeShift() {
    if (!shift) return;
    const cashIds = accounts.filter((a) => a.type === "cash").map((a) => a.id);
    const { data: ss } = await supabase.from("sales").select("total,paid_amount,account_id").eq("shift_id", shift.id);
    const cashIn = (ss ?? []).filter((x) => x.account_id && cashIds.includes(x.account_id)).reduce((a, x) => a + Number(x.paid_amount ?? x.total), 0);
    const exp = expectedCash(Number(shift.opening_cash), cashIn);
    const v = prompt(`Expected cash: ${money(exp)}. Count the drawer and enter actual cash:`, String(exp));
    if (v === null) return;
    const counted = Number(v) || 0;
    const { error } = await supabase.from("shifts").update({ closed_at: new Date().toISOString(), expected_cash: exp, closing_cash: counted }).eq("id", shift.id);
    if (error) return void toast.error(error.message);
    const diff = r2(counted - exp);
    toast.success(diff === 0 ? "Shift closed · cash matches" : `Shift closed · ${diff > 0 ? "over" : "short"} by ${money(Math.abs(diff))}`);
    refetchShift();
  }

  async function quickAdd() {
    const name = prompt("Customer name");
    if (!name?.trim()) return;
    const phone = prompt("Phone (optional)") || null;
    const { data, error } = await supabase.from("customers").insert({ name: name.trim(), phone }).select().single();
    if (error) return void toast.error(error.message);
    await refresh(); setCustomerId(data.id);
  }

  async function charge(print: boolean) {
    if (lines.length === 0) return void toast.error("Add at least one item");
    if (discount < 0 || discount > subtotal - itemDiscount) return void toast.error("Discount must be between 0 and the subtotal");
    if (due > 0 && !cust) return void toast.error("Select a customer to sell on due");
    if (paidNum > total) return void toast.error("Paid amount can't be more than the total");
    if (cust && due > 0 && Number(cust.credit_limit) > 0 && prevDue + due > Number(cust.credit_limit))
      return void toast.error(`Credit limit exceeded (${money(Number(cust.credit_limit))})`);
    const base = subtotal - itemDiscount;
    if (r?.manager_pin && base > 0 && (discount / base) * 100 > Number(r.max_discount_percent ?? 0)) {
      const pin = prompt(`Discount above ${Number(r.max_discount_percent)}% needs the manager PIN`);
      if (pin !== r.manager_pin) return void toast.error("Wrong manager PIN");
    }
    setBusy(true);
    const cost = r2(lines.reduce((a, l) => a + l.qty * Number(get(l.id)?.cost ?? 0), 0));
    const { data: sale, error } = await supabase.from("sales").insert({
      sale_date: todayIn(r?.time_zone), account_id: account || null, customer: cust?.name ?? null, customer_id: cust?.id ?? null, discount: totalDiscount, tax, total, cost_total: cost,
      paid_amount: paidNum, points_redeemed: redeem.used, salesperson_id: seller === "none" ? null : seller, shift_id: shift?.id ?? null,
    }).select().single();
    if (error) { setBusy(false); return void toast.error(error.message); }
    const { error: e2 } = await supabase.from("sale_items").insert(lines.map((l) => {
      const m = get(l.id)!;
      return { sale_id: sale.id, menu_item_id: m.id, name: m.name, qty: l.qty, price: m.price, cost: m.cost };
    }));
    if (cust) {
      const earned = earnPoints(total, Number(r?.points_per_unit ?? 0));
      if (earned || redeem.used) await supabase.from("customers").update({ points: Number(cust.points) - redeem.used + earned }).eq("id", cust.id);
    }
    setBusy(false);
    if (e2) return void toast.error(e2.message);
    if (print) window.open(`/print/${sale.id}?type=receipt`, "_blank");
    toast.success(`Sale of ${money(total)} recorded`);
    clear(); setSheet(false); refresh();
  }

  const cart = (
      <div className="flex h-full flex-col">
        {cust && (
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-medium text-primary">
            <span className="flex min-w-0 items-center gap-1.5"><UserRound className="size-3.5 shrink-0" /><span className="truncate">{cust.name}{cust.tier ? ` · ${cust.tier}` : ""}</span></span>
            <button type="button" aria-label="Remove customer" className="flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-primary/15" onClick={() => { setCustomerId("walkin"); setUsePoints(false); }}>✕</button>
          </div>
        )}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {lines.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <ShoppingBag className="size-8" /> Tap items to add them to the order
          </div>
        )}
        {lines.map((l) => {
          const m = get(l.id)!;
          return (
            <div key={l.id} className="flex items-center gap-2 rounded-lg border bg-background p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="num text-xs text-muted-foreground">{money(Number(m.price))} each</p>
                <div className="mt-4 flex items-center gap-1.5 pt-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Disc.</span>
                  <div className="flex rounded-full border text-[11px]">
                    {(["pct", "amt"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setDisc(l.id, { dType: t, dVal: l.dType ? (l.dVal ?? 0) : t === "pct" ? Number(m.discount_percent ?? 0) : 0 })}
                        className={cn("rounded-full px-2 py-0.5", (l.dType ?? "pct") === t && "bg-primary text-primary-foreground")}>{t === "pct" ? "%" : r?.currency_symbol || "Amt"}</button>
                    ))}
                  </div>
                  <Input className="h-7 w-16 px-2 text-xs" type="number" min={0} step="0.01" aria-label={`Discount for ${m.name}`}
                    value={l.dType ? (l.dVal ?? 0) : Number(m.discount_percent ?? 0)}
                    onChange={(e) => setDisc(l.id, { dType: l.dType ?? "pct", dVal: Math.max(0, Number(e.target.value)) })} />
                </div>
              </div>
              <div className="flex shrink-0 items-center rounded-md border">
                <Button size="icon" variant="ghost" className="size-8" aria-label="Less" onClick={() => setQty(l.id, l.qty - 1)}><Minus className="size-3" /></Button>
                <span className="num w-7 text-center text-sm font-semibold">{l.qty}</span>
                <Button size="icon" variant="ghost" className="size-8" aria-label="More" onClick={() => add(m)}><Plus className="size-3" /></Button>
              </div>
              <span className="num w-20 shrink-0 text-right text-sm font-semibold">{money(lineNet(l))}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-3 border-t pt-3">
        <div className="space-y-1"><Label className="text-xs">Customer</Label>
          <Select value={customerId} onValueChange={(v) => { if (v === "new") return void quickAdd(); setCustomerId(v); setUsePoints(false); }}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="walkin">Walk-in</SelectItem><SelectItem value="new">+ New customer</SelectItem>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Flat discount</Label><Input className="h-9" type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
        {cust && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2 text-xs">
            <span>{cust.tier} · {Math.round(Number(cust.points))} pts{prevDue > 0 && <span className="ml-1 font-semibold text-destructive">· due {money(prevDue)}</span>}</span>
            {pointValue > 0 && Number(cust.points) > 0 && <label className="flex items-center gap-1"><input type="checkbox" className="accent-primary" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />Use points</label>}
          </div>
        )}
        {staff.some((s) => s.active) && <div className="space-y-1"><Label className="text-xs">Salesperson</Label>
          <Select value={seller} onValueChange={setSeller}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not tagged</SelectItem>{staff.filter((s) => s.active).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        </div>}
        <div className="space-y-1"><Label className="text-xs">Paid now (empty = full payment)</Label><Input className="h-9" type="number" min={0} step="0.01" placeholder={String(total)} value={paid} onChange={(e) => setPaid(e.target.value)} /><p className="text-[11px] text-muted-foreground">Selling on due needs a customer selected.</p></div>
        <div className="space-y-1"><Label className="text-xs">Payment to</Label>
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Account" /></SelectTrigger>
            <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="num space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {itemDiscount > 0 && <div className="flex justify-between text-muted-foreground"><span>Item discounts</span><span>−{money(itemDiscount)}</span></div>}
          {discount > 0 && <div className="flex justify-between text-muted-foreground"><span>Flat discount</span><span>−{money(discount)}</span></div>}
          {redeem.value > 0 && <div className="flex justify-between text-muted-foreground"><span>Points ({redeem.used})</span><span>−{money(redeem.value)}</span></div>}
          {r?.tax_enabled && (
            <div className="flex items-center justify-between text-muted-foreground">
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)} />{taxLabel || r.tax_label || "VAT"}</label>
              <span>{money(tax)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-display text-xl font-semibold"><span>Total</span><span>{money(total)}</span></div>
          {due > 0 && <div className="flex justify-between font-semibold text-destructive"><span>Due on account</span><span>{money(due)}</span></div>}
        </div>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
          <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Clear order" disabled={!lines.length} onClick={clear}><Trash2 /></Button>
          <Button variant="secondary" className="h-11" disabled={busy || !lines.length} onClick={() => charge(false)}>Save</Button>
          <Button className="h-11" disabled={busy || !lines.length} onClick={() => charge(true)}>Charge & print</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="-m-4 grid h-[calc(100dvh-3.5rem)] md:-m-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="flex min-h-0 min-w-0 flex-col p-4 md:p-6">
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px] sm:items-center">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold">Point of Sale</h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{active.length} items available
              {shift ? <button className="rounded-full bg-success/15 px-3 py-0.5 text-xs font-semibold text-success" onClick={closeShift}>Shift open · Close</button>
                : <button className="rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold" onClick={openShift}>Open shift</button>}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search or scan barcode" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") scan(); }} autoFocus />
          </div>
        </div>
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors", cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>{c}</button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {shown.map((m) => {
              const inCart = lines.find((l) => l.id === m.id)?.qty;
              return (
                <button key={m.id} onClick={() => add(m)} className={cn("group relative overflow-hidden rounded-xl border bg-card text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary active:scale-[0.98]", inCart && "border-primary ring-2 ring-primary/30")}>
                  <div className="aspect-[4/3] bg-secondary">
                    {m.image_url ? <img src={m.image_url} alt={m.name} className="size-full object-cover" loading="lazy" /> : <div className="flex size-full items-center justify-center text-muted-foreground"><ShoppingBag className="size-8" /></div>}
                  </div>
                  {Number(m.discount_percent) > 0 && <span className="num absolute left-2 top-2 rounded-full bg-success px-2 py-0.5 text-xs font-bold text-success-foreground">−{Number(m.discount_percent)}%</span>}
                  {inCart && <span className="num absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{inCart}</span>}
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">{m.brand ? `${m.brand} · ` : ""}{m.category}</span>
                      <span className="num shrink-0 text-sm font-bold text-primary">{money(Number(m.price))}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {shown.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No items found. Add items on the Products page.</p>}
        </div>
      </section>

      <aside className="hidden min-h-0 flex-col border-l bg-card p-5 lg:flex">
        <h2 className="mb-3 flex items-center justify-between text-lg font-semibold">Current order <span className="num text-sm font-normal text-muted-foreground">{count} items</span></h2>
        {cart}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card p-3 lg:hidden">
        <Button className="h-12 w-full justify-between text-base" onClick={() => setSheet(true)}>
          <span className="flex items-center gap-2"><ShoppingBag /> {count} items</span>
          <span className="num font-semibold">{money(total)}</span>
        </Button>
      </div>
      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="bottom" className="flex h-[88dvh] flex-col rounded-t-2xl">
          <SheetHeader><SheetTitle>Current order</SheetTitle></SheetHeader>
          <div className="min-h-0 flex-1">{cart}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
