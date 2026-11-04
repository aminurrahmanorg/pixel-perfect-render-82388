import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

type Msg = { role: "user" | "assistant"; content: string };
const n = (v: unknown) => Number(v ?? 0);
const r2 = (x: number) => Math.round(x * 100) / 100;

async function buildSummary(sb: SupabaseClient<Database>): Promise<string> {
    const since = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
    const all = async <T,>(q: PromiseLike<{ data: T[] | null }>): Promise<T[]> => (await q).data ?? [];
    const [store, sales, items, expenses, income, customers, payments, products] = await Promise.all([
      sb.from("restaurants").select("name,currency,time_zone").maybeSingle(),
      all(sb.from("sales").select("id,sale_date,total,tax,discount,cost_total,paid_amount,customer_id").gte("sale_date", since).range(0, 9999)),
      all(sb.from("sale_items").select("sale_id,name,qty,price,cost").range(0, 19999)),
      all(sb.from("expenses").select("expense_date,category,amount").gte("expense_date", since).range(0, 9999)),
      all(sb.from("income").select("income_date,source,amount").gte("income_date", since).range(0, 9999)),
      all(sb.from("customers").select("id,name,tier,points,phone").range(0, 4999)),
      all(sb.from("customer_payments").select("customer_id,amount").range(0, 9999)),
      all(sb.from("menu_items").select("name,category,brand,price,cost,active,discount_percent,track_stock,stock_qty,low_stock_at").range(0, 4999)),
    ]);

    // Daily totals (revenue = total − tax; profit = revenue − cost − expenses + income).
    const days: Record<string, { sales: number; orders: number; cost: number; expenses: number; income: number; tax: number; discount: number }> = {};
    const day = (d: string) => (days[d] ??= { sales: 0, orders: 0, cost: 0, expenses: 0, income: 0, tax: 0, discount: 0 });
    for (const s of sales) { const x = day(String(s.sale_date)); x.sales += n(s.total) - n(s.tax); x.orders++; x.cost += n(s.cost_total); x.tax += n(s.tax); x.discount += n(s.discount); }
    for (const e of expenses) day(String(e.expense_date)).expenses += n(e.amount);
    for (const i of income) day(String(i.income_date)).income += n(i.amount);
    const daily = Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([d, x]) => ({ d, ...Object.fromEntries(Object.entries(x).map(([k, v]) => [k, r2(v)])) }));

    const saleIds = new Set(sales.map((s) => s.id));
    const prod: Record<string, { qty: number; revenue: number }> = {};
    for (const it of items) if (saleIds.has(it.sale_id)) { const p = (prod[String(it.name)] ??= { qty: 0, revenue: 0 }); p.qty += n(it.qty); p.revenue += n(it.qty) * n(it.price); }
    const expCat: Record<string, number> = {};
    for (const e of expenses) expCat[String(e.category)] = r2((expCat[String(e.category)] ?? 0) + n(e.amount));

    const custRows = customers.map((c) => {
      const mine = sales.filter((s) => s.customer_id === c.id);
      const owed = mine.reduce((a, s) => a + (s.paid_amount == null ? 0 : Math.max(0, n(s.total) - n(s.paid_amount))), 0);
      const paid = payments.filter((p) => p.customer_id === c.id).reduce((a, p) => a + n(p.amount), 0);
      return { name: c.name, tier: c.tier, points: n(c.points), spent: r2(mine.reduce((a, s) => a + n(s.total), 0)), visits: mine.length, due: r2(Math.max(0, owed - paid)) };
    });

    return JSON.stringify({
      store: store.data, period: `${since} to today`, daily,
      products_sold: Object.entries(prod).map(([name, p]) => ({ name, qty: p.qty, revenue: r2(p.revenue) })).sort((a, b) => b.revenue - a.revenue),
      expense_by_category: expCat, customers: custRows, catalog: products,
      today: new Date().toISOString().slice(0, 10),
    });

}

const textOf = (res: Awaited<ReturnType<typeof generateResponse>>) => (res.output ?? [])
  .flatMap((o) => (o.type === "message" ? o.content : []))
  .map((c) => (c.type === "output_text" ? c.text : ""))
  .join("").trim();

function aiError(e: unknown) {
  console.error("ai error", e);
  if (e instanceof GatewayError && e.code === "payment_required") return "AI credits have run out. Please top up to keep using AI features.";
  if (e instanceof GatewayError && e.code === "rate_limited") return "Too many AI requests right now — please try again in a minute.";
  return "AI is unavailable right now. Please try again.";
}

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messages: Msg[] }) => {
    if (!Array.isArray(d?.messages) || d.messages.length === 0) throw new Error("No question");
    return { messages: d.messages.slice(-12).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) }) as Msg) };
  })
  .handler(async ({ data, context }) => {
    const context_json = await buildSummary(context.supabase);
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `You are the AI business assistant inside a POS / business manager app. Answer the owner's questions using ONLY the store data below (last 120 days). Do the math carefully, show amounts in the store currency, keep answers short and practical, use plain "-" bullet points (no markdown like ** or #), and give 1-2 actionable suggestions when useful. Reply in the same language the user writes in (Bangla or English). If the data can't answer it, say so.\n\nSTORE DATA:\n${context_json}`,
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      return { text: textOf(res) || "Sorry, I couldn't produce an answer.", error: null as string | null };
    } catch (e) {
      return { text: "", error: aiError(e) };
    }
  });

export const INSIGHTS = {
  daily: "Write today's business summary: today's and yesterday's sales, profit, orders, vs the 7-day average, top items, and one thing to do tomorrow.",
  reorder: "Smart reorder: for every product with track_stock=true, estimate daily sales rate from products_sold over the period, days of stock left, and suggest how many to reorder (cover 14 days). List the most urgent first. Also flag products not tracked but selling fast.",
  forecast: "Sales forecast: using daily sales, forecast the next 7 days (per day) and the next 30-day total, mention weekday patterns and trend, and give a confidence note.",
  customers: "Customer insights: identify the best customers, customers at risk of churning (no recent visits), customers with dues to chase, and suggest a tier upgrade or offer for 3 of them.",
  discount: "Discount advisor: find slow-moving or overstocked products and high-margin items where a discount would help, propose a specific discount % for each with the expected effect, and warn against discounting low-margin items.",
  alerts: "Unusual activity: look for anomalies — days with unusually high discounts, very low or high sales, expense spikes, products sold below cost, large dues, negative stock. List each alert with date and amount, most serious first. If nothing unusual, say so.",
} as const;
export type InsightKind = keyof typeof INSIGHTS;

export const aiInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: InsightKind; lang?: "en" | "bn" }) => {
    if (!(d?.kind in INSIGHTS)) throw new Error("Unknown insight");
    return { kind: d.kind, lang: d.lang === "bn" ? "bn" : "en" } as const;
  })
  .handler(async ({ data, context }) => {
    const context_json = await buildSummary(context.supabase);
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `You are a sharp retail analyst inside a POS app. Use ONLY the store data. Do math carefully, use the store currency, be concise, plain "-" bullets, no markdown symbols like ** or #. Write in ${data.lang === "bn" ? "Bangla" : "English"}.\n\nSTORE DATA:\n${context_json}`,
        input: INSIGHTS[data.kind],
      });
      return { text: textOf(res), error: null as string | null };
    } catch (e) {
      return { text: "", error: aiError(e) };
    }
  });

export const aiProductFromPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { image: string }) => {
    if (typeof d?.image !== "string" || !d.image.startsWith("data:image/") || d.image.length > 7_000_000) throw new Error("Please send an image under 5 MB");
    return { image: d.image };
  })
  .handler(async ({ data }) => {
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: 'You identify retail products from photos for a POS catalog. Reply with ONLY a JSON object: {"name": string, "category": string, "brand": string|null, "price": number|null, "barcode": string|null, "description": string}. Read any visible brand, label, printed price or barcode digits. Keep name short and sellable.',
        input: [{ role: "user", content: [{ type: "input_text", text: "Identify this product." }, { type: "input_image", image_url: data.image, detail: "auto" }] }],
      });
      const t = textOf(res);
      const m = t.match(/\{[\s\S]*\}/);
      if (!m) return { product: null, error: "Couldn't recognise the product. Try a clearer photo." };
      const p = JSON.parse(m[0]) as { name?: string; category?: string; brand?: string | null; price?: number | null; barcode?: string | null };
      return { product: { name: String(p.name ?? "").slice(0, 120), category: String(p.category ?? "General").slice(0, 60), brand: p.brand ? String(p.brand).slice(0, 60) : null, price: typeof p.price === "number" && p.price >= 0 ? p.price : 0, barcode: p.barcode ? String(p.barcode).slice(0, 40) : null }, error: null as string | null };
    } catch (e) {
      return { product: null, error: aiError(e) };
    }
  });
