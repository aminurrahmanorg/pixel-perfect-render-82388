import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DashboardSummary, Tables } from "@/integrations/supabase/types";

export type Restaurant = Tables<"restaurants">;
export type Account = Tables<"accounts">;
export type MenuItem = Tables<"menu_items">;
export type ProductCategory = Tables<"product_categories">;
export type Sale = Tables<"sales">;
export type SaleItem = Tables<"sale_items">;
export type Expense = Tables<"expenses">;
export type Income = Tables<"income">;
export type Transfer = Tables<"transfers">;
export type ActivityLog = Tables<"activity_logs">;
export type Staff = Tables<"staff">;
export type Customer = Tables<"customers">;
export type CustomerPayment = Tables<"customer_payments">;

type TableName = "accounts" | "menu_items" | "product_categories" | "sales" | "sale_items" | "expenses" | "income" | "transfers" | "staff" | "customers" | "customer_payments" | "stock_moves" | "sale_returns";

/** Pages through results so totals stay correct beyond the 1000-row API limit. */
export async function fetchAll<T>(table: TableName, order: string, columns = "*"): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(order, { ascending: false })
      .range(from, from + size - 1);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < size) break;
  }
  return out;
}

export const useRestaurant = () =>
  useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useDashboardSummary = (from: string, to: string, today: string) =>
  useQuery({
    queryKey: ["dashboard_summary", from, to, today],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_summary", {
        p_from: from,
        p_to: to,
        p_today: today,
      });
      if (error) throw error;
      return data as DashboardSummary;
    },
  });

export const useAccounts = () =>
  useQuery({ queryKey: ["accounts"], queryFn: () => fetchAll<Account>("accounts", "created_at") });
export const useSaleReturns = () =>
  useQuery({ queryKey: ["sale_returns"], queryFn: () => fetchAll<Tables<"sale_returns">>("sale_returns", "return_date") });
export const useDashboardAccounts = () =>
  useQuery({
    queryKey: ["dashboard", "accounts"],
    queryFn: () => fetchAll<Pick<Account, "id" | "type" | "opening_balance">>("accounts", "created_at", "id,type,opening_balance"),
  });
export const useDashboardSales = () =>
  useQuery({
    queryKey: ["dashboard", "sales"],
    queryFn: () =>
      fetchAll<Pick<Sale, "id" | "sale_date" | "total" | "tax" | "cost_total" | "account_id" | "paid_amount">>(
        "sales",
        "sale_date",
        "id,sale_date,total,tax,cost_total,account_id,paid_amount",
      ),
  });
export const useDashboardExpenses = () =>
  useQuery({
    queryKey: ["dashboard", "expenses"],
    queryFn: () =>
      fetchAll<Pick<Expense, "expense_date" | "amount" | "category" | "account_id">>(
        "expenses",
        "expense_date",
        "expense_date,amount,category,account_id",
      ),
  });
export const useDashboardIncome = () =>
  useQuery({
    queryKey: ["dashboard", "income"],
    queryFn: () =>
      fetchAll<Pick<Income, "income_date" | "amount" | "account_id">>(
        "income",
        "income_date",
        "income_date,amount,account_id",
      ),
  });
export const useDashboardTransfers = () =>
  useQuery({
    queryKey: ["dashboard", "transfers"],
    queryFn: () =>
      fetchAll<Pick<Transfer, "from_account_id" | "to_account_id" | "amount">>(
        "transfers",
        "transfer_date",
        "from_account_id,to_account_id,amount",
      ),
  });
export const useDashboardCustomerPayments = () =>
  useQuery({
    queryKey: ["dashboard", "customer_payments"],
    queryFn: () =>
      fetchAll<Pick<CustomerPayment, "account_id" | "amount">>(
        "customer_payments",
        "payment_date",
        "account_id,amount",
      ),
  });
export const useDashboardMenuItems = () =>
  useQuery({
    queryKey: ["dashboard", "menu_items"],
    queryFn: () =>
      fetchAll<Pick<MenuItem, "track_stock" | "stock_qty" | "low_stock_at">>(
        "menu_items",
        "created_at",
        "track_stock,stock_qty,low_stock_at",
      ),
  });
export const useDashboardSaleReturns = () =>
  useQuery({
    queryKey: ["dashboard", "sale_returns"],
    queryFn: () =>
      fetchAll<Pick<Tables<"sale_returns">, "return_date" | "refund">>(
        "sale_returns",
        "return_date",
        "return_date,refund",
      ),
  });
export const useDashboardSaleItems = (saleIds: string[]) =>
  useQuery({
    queryKey: ["dashboard", "sale_items", saleIds],
    queryFn: async () => {
      const out: Pick<SaleItem, "sale_id" | "name" | "qty" | "price" | "cost">[] = [];
      for (let start = 0; start < saleIds.length; start += 100) {
        const batch = saleIds.slice(start, start + 100);
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase
            .from("sale_items")
            .select("sale_id,name,qty,price,cost")
            .in("sale_id", batch)
            .order("id", { ascending: false })
            .range(offset, offset + 999);
          if (error) throw error;
          out.push(...(data ?? []));
          if (!data || data.length < 1000) break;
        }
      }
      return out;
    },
  });
export const useRole = () =>
  useQuery({ queryKey: ["role"], queryFn: async () => ((await supabase.rpc("current_store_role")).data ?? "owner") as "owner" | "manager" | "cashier" });
export const CASHIER_PAGES = ["/pos", "/sales", "/customers", "/menu", "/inventory"];
export const useMenuItems = () =>
  useQuery({ queryKey: ["menu_items"], queryFn: () => fetchAll<MenuItem>("menu_items", "created_at") });
export const useProductCategories = () =>
  useQuery({ queryKey: ["product_categories"], queryFn: () => fetchAll<ProductCategory>("product_categories", "name") });
export const useSales = () =>
  useQuery({ queryKey: ["sales"], queryFn: () => fetchAll<Sale>("sales", "sale_date") });
export const useSaleItems = () =>
  useQuery({ queryKey: ["sale_items"], queryFn: () => fetchAll<SaleItem>("sale_items", "id") });
export const useExpenses = () =>
  useQuery({ queryKey: ["expenses"], queryFn: () => fetchAll<Expense>("expenses", "expense_date") });

export const useIncome = () =>
  useQuery({ queryKey: ["income"], queryFn: () => fetchAll<Income>("income", "income_date") });
export const useTransfers = () =>
  useQuery({ queryKey: ["transfers"], queryFn: () => fetchAll<Transfer>("transfers", "transfer_date") });
export const useStaff = () =>
  useQuery({ queryKey: ["staff"], queryFn: () => fetchAll<Staff>("staff", "created_at") });
export const useCustomers = () =>
  useQuery({ queryKey: ["customers"], queryFn: () => fetchAll<Customer>("customers", "created_at") });
export const useCustomerPayments = () =>
  useQuery({ queryKey: ["customer_payments"], queryFn: () => fetchAll<CustomerPayment>("customer_payments", "payment_date") });
export const useActivity = () =>
  useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });

/** Money-safe rounding to 2 decimals (avoids float drift like 0.1+0.2). */
export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type TaxSettings = { tax_enabled?: boolean | null; tax_mode?: string | null; tax_percent?: number | null; tax_fixed?: number | null; tax_inclusive?: boolean | null; tax_label?: string | null };
/** Tax on (subtotal − discount). Modes: percent (exclusive or inclusive) or fixed amount per sale. Optional. */
export function calcTax(taxable: number, t: TaxSettings | null | undefined, apply = true) {
  const base = r2(Math.max(0, taxable));
  if (!apply || !t?.tax_enabled || base === 0) return { tax: 0, total: base, label: "" };
  const name = t.tax_label || "VAT";
  if (t.tax_mode === "fixed") {
    const tax = r2(Math.max(0, Number(t.tax_fixed ?? 0)));
    return { tax, total: r2(base + tax), label: name };
  }
  const p = Math.max(0, Number(t.tax_percent ?? 0));
  if (t.tax_inclusive) {
    const tax = r2(base - base / (1 + p / 100));
    return { tax, total: base, label: `${name} ${p}% incl.` };
  }
  const tax = r2((base * p) / 100);
  return { tax, total: r2(base + tax), label: `${name} ${p}%` };
}

/** Revenue of a sale excluding tax (tax is owed to government, not profit). */
export const netSale = (s: Sale) => Number(s.total) - Number(s.tax);

export function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useMoney() {
  const { data: r } = useRestaurant();
  const currency = r?.currency ?? "USD";
  return (n: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
    } catch {
      return `${r?.currency_symbol ?? ""}${n.toFixed(2)}`;
    }
  };
}

/** Today's date (YYYY-MM-DD) in the business's time zone. */
export function todayIn(tz?: string | null) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Balance = opening + sales received + other income + transfers in − expenses paid − transfers out. */
export function accountBalances(
  accounts: Pick<Account, "id" | "opening_balance">[],
  sales: Pick<Sale, "account_id" | "paid_amount" | "total">[],
  expenses: Pick<Expense, "account_id" | "amount">[],
  income: Pick<Income, "account_id" | "amount">[] = [],
  transfers: Pick<Transfer, "from_account_id" | "to_account_id" | "amount">[] = [],
  payments: Pick<CustomerPayment, "account_id" | "amount">[] = [],
) {
  const map = new Map<string, number>();
  accounts.forEach((a) => map.set(a.id, Number(a.opening_balance)));
  const add = (id: string | null, v: number) => { if (id && map.has(id)) map.set(id, map.get(id)! + v); };
  sales.forEach((s) => add(s.account_id, s.paid_amount == null ? Number(s.total) : Number(s.paid_amount)));
  payments.forEach((p) => add(p.account_id, Number(p.amount)));
  income.forEach((i) => add(i.account_id, Number(i.amount)));
  expenses.forEach((e) => add(e.account_id, -Number(e.amount)));
  transfers.forEach((t) => { add(t.from_account_id, -Number(t.amount)); add(t.to_account_id, Number(t.amount)); });
  map.forEach((v, k) => map.set(k, r2(v)));
  return map;
}

export const sum = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, x) => a + f(x), 0);

export const pctChange = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : 100) : ((cur - prev) / Math.abs(prev)) * 100);

export const EXPENSE_CATEGORIES = [
  "Rent", "Salaries", "Utilities", "Supplies", "Stock purchase", "Maintenance", "Marketing", "Transport", "Taxes", "Other",
];

export const currencies: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("currency");
  } catch {
    return ["USD", "EUR", "GBP", "BDT", "SAR", "AED", "INR", "PKR"];
  }
})();
export const timeZones: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC"];
  }
})();
export function currencySymbol(code: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}
export const INCOME_SOURCES = ["Wholesale order", "Commission", "Function / event", "Rental", "Interest", "Other"];
export const STAFF_ROLES = ["Manager", "Salesperson", "Cashier", "Storekeeper", "Technician", "Accountant", "Delivery", "Staff"];
export const CUSTOMER_TIERS = ["Regular", "Silver", "Gold", "VIP"];
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
