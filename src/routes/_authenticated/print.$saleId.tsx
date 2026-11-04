import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { r2, useMoney, useRestaurant } from "@/lib/data";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/print/$saleId")({
  validateSearch: (s: Record<string, unknown>) => ({ type: s["type"] === "invoice" ? ("invoice" as const) : ("receipt" as const) }),
  head: () => ({ meta: [{ title: "Print — Business Manager Pro" }] }),
  component: PrintPage,
});

function PrintPage() {
  const { saleId } = Route.useParams();
  const { type } = Route.useSearch();
  const { data: r } = useRestaurant();
  const money = useMoney();
  const { data } = useQuery({
    queryKey: ["print", saleId],
    queryFn: async () => {
      const [{ data: sale, error }, { data: items }] = await Promise.all([
        supabase.from("sales").select("*, accounts(name), staff(name)").eq("id", saleId).single(),
        supabase.from("sale_items").select("*").eq("sale_id", saleId),
      ]);
      if (error) throw error;
      return { sale, items: items ?? [] };
    },
  });

  useEffect(() => {
    if (data && r) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [data, r]);

  if (!data || !r) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  const { sale, items } = data;
  const subtotal = items.reduce((a, i) => a + Number(i.qty) * Number(i.price), 0);
  const no = sale.id.slice(0, 8).toUpperCase();
  const meta = sale as unknown as { accounts: { name: string } | null; staff: { name: string } | null };
  const paid = meta.accounts?.name ?? "—";
  const salesperson = meta.staff?.name ?? null;
  const paidAmt = sale.paid_amount == null ? Number(sale.total) : Number(sale.paid_amount);
  const dueAmt = Math.max(0, r2(Number(sale.total) - paidAmt));

  const toolbar = (
    <div className="print-hide mb-6 flex justify-center gap-2">
      <Button onClick={() => window.print()}><Printer /> Print</Button>
      <Button variant="outline" onClick={() => window.close()}>Close</Button>
    </div>
  );

  if (type === "receipt") {
    return (
      <div className="min-h-screen bg-muted py-8 print:bg-background print:py-0">
        {toolbar}
        <div className="receipt mx-auto w-[80mm] bg-card p-4 font-mono text-xs text-card-foreground shadow-card print:shadow-none">
          <div className="text-center">
            {r.logo_url && <img src={r.logo_url} alt="" className="mx-auto mb-2 h-10" />}
            <p className="text-sm font-bold">{r.name}</p>
            {r.address && <p>{r.address}</p>}
            {r.phone && <p>Tel: {r.phone}</p>}
          </div>
          <div className="my-2 border-t border-dashed" />
          <p>Receipt #{no}</p>
          <p>Date: {sale.sale_date} {new Date(sale.created_at).toLocaleTimeString()}</p>
          {sale.customer && <p>Customer: {sale.customer}</p>}
          <div className="my-2 border-t border-dashed" />
          {items.map((i) => (
            <div key={i.id} className="mb-1">
              <p>{i.name}</p>
              <p className="flex justify-between"><span>{Number(i.qty)} x {money(Number(i.price))}</span><span>{money(Number(i.qty) * Number(i.price))}</span></p>
            </div>
          ))}
          <div className="my-2 border-t border-dashed" />
          <p className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></p>
          {Number(sale.discount) > 0 && <p className="flex justify-between"><span>Discount</span><span>-{money(Number(sale.discount))}</span></p>}
          {Number(sale.tax) > 0 && <p className="flex justify-between"><span>{r.tax_label || "Tax"}</span><span>{money(Number(sale.tax))}</span></p>}
          <p className="mt-1 flex justify-between text-sm font-bold"><span>TOTAL</span><span>{money(Number(sale.total))}</span></p>
          <p className="flex justify-between"><span>Paid via</span><span>{paid}</span></p>
          <p className="flex justify-between"><span>Paid</span><span>{money(paidAmt)}</span></p>
          {dueAmt > 0 && <p className="flex justify-between font-bold"><span>DUE</span><span>{money(dueAmt)}</span></p>}
          {Number(sale.points_redeemed) > 0 && <p className="flex justify-between"><span>Points used</span><span>{Number(sale.points_redeemed)}</span></p>}
          {salesperson && <p>Salesperson: {salesperson}</p>}
          <div className="my-2 border-t border-dashed" />
          <p className="text-center">Thank you! Come again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8 print:bg-background print:py-0">
      {toolbar}
      <div className="mx-auto max-w-[210mm] bg-card p-12 text-sm text-card-foreground shadow-card print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            {r.logo_url && <img src={r.logo_url} alt="" className="mb-3 h-12" />}
            <p className="font-display text-xl font-semibold">{r.name}</p>
            <p className="text-muted-foreground">{[r.address, r.country].filter(Boolean).join(", ")}</p>
            <p className="text-muted-foreground">{[r.phone, r.email].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-semibold text-primary">INVOICE</p>
            <p className="mt-2">No. <b>INV-{no}</b></p>
            <p>Date: {sale.sale_date}</p>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-xs uppercase text-muted-foreground">Bill to</p>
          <p className="font-medium">{sale.customer || "Walk-in customer"}</p>
        </div>
        <table className="num mt-6 w-full">
          <thead>
            <tr className="border-b-2 border-foreground text-left text-xs uppercase">
              <th className="py-2">#</th><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit price</th><th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={i.id} className="border-b">
                <td className="py-2">{idx + 1}</td><td className="py-2">{i.name}</td>
                <td className="py-2 text-right">{Number(i.qty)}</td>
                <td className="py-2 text-right">{money(Number(i.price))}</td>
                <td className="py-2 text-right">{money(Number(i.qty) * Number(i.price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="num ml-auto mt-4 w-64 space-y-1">
          <p className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></p>
          {Number(sale.discount) > 0 && <p className="flex justify-between"><span>Discount</span><span>-{money(Number(sale.discount))}</span></p>}
          {Number(sale.tax) > 0 && <p className="flex justify-between"><span>{r.tax_label || "Tax / VAT"}</span><span>{money(Number(sale.tax))}</span></p>}
          <p className="flex justify-between border-t-2 border-foreground pt-2 text-base font-semibold"><span>Total</span><span>{money(Number(sale.total))}</span></p>
          <p className="flex justify-between text-muted-foreground"><span>Paid via</span><span>{paid}</span></p>
          <p className="flex justify-between"><span>Paid</span><span>{money(paidAmt)}</span></p>
          {dueAmt > 0 && <p className="flex justify-between font-semibold text-destructive"><span>Due</span><span>{money(dueAmt)}</span></p>}
          {Number(sale.points_redeemed) > 0 && <p className="flex justify-between"><span>Points used</span><span>{Number(sale.points_redeemed)}</span></p>}
          {salesperson && <p className="flex justify-between text-muted-foreground"><span>Salesperson</span><span>{salesperson}</span></p>}
        </div>
        <p className="mt-16 text-center text-xs text-muted-foreground">Thank you for shopping with {r.name}.</p>
      </div>
    </div>
  );
}
