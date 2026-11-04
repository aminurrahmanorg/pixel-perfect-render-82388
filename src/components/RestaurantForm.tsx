import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencies, currencySymbol, MONTHS, timeZones, type Restaurant } from "@/lib/data";

export type RestaurantInput = Omit<Restaurant, "id" | "owner_id" | "created_at">;

export function RestaurantForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
}: {
  initial?: Partial<RestaurantInput>;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (v: RestaurantInput) => void;
}) {
  const guessTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const [v, setV] = useState<RestaurantInput>({
    name: "", logo_url: "", owner_name: "", phone: "", email: "", country: "", address: "",
    time_zone: guessTz, currency: "USD", currency_symbol: "$", tax_percent: 0, fy_start_month: 1,
    tax_enabled: false, tax_mode: "percent", tax_fixed: 0, tax_label: "VAT", tax_inclusive: false,
    ...initial,
  } as RestaurantInput);
  const set = <K extends keyof RestaurantInput>(k: K, val: RestaurantInput[K]) => setV((p) => ({ ...p, [k]: val }));
  const field = (k: keyof RestaurantInput, label: string, type = "text", required = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} required={required} value={(v[k] as string | number | null) ?? ""} onChange={(e) => set(k, (type === "number" ? Number(e.target.value) : e.target.value) as never)} />
    </div>
  );
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Business name", "text", true)}
        {field("owner_name", "Owner name")}
        {field("phone", "Phone")}
        {field("email", "Email", "email")}
        {field("country", "Country")}
        {field("address", "Address")}
        <div className="space-y-1.5"><Label>Logo</Label><ImageUpload label="Upload logo" value={v.logo_url} onChange={(u) => set("logo_url", u)} /></div>
        <div className="space-y-1.5">
          <Label>Time zone</Label>
          <Select value={v.time_zone} onValueChange={(x) => set("time_zone", x)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">{timeZones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={v.currency} onValueChange={(x) => setV((p) => ({ ...p, currency: x, currency_symbol: currencySymbol(x) }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">{currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {field("currency_symbol", "Currency symbol", "text", true)}
        <div className="space-y-3 rounded-xl border bg-secondary/40 p-4 sm:col-span-2">
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" className="size-4 accent-primary" checked={!!v.tax_enabled} onChange={(e) => set("tax_enabled", e.target.checked)} />
            Charge VAT / Tax on sales (optional)
          </label>
          {v.tax_enabled && (
            <div className="grid gap-4 sm:grid-cols-3">
              {field("tax_label", "Tax name (e.g. VAT, GST)")}
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={v.tax_mode ?? "percent"} onValueChange={(x) => set("tax_mode", x)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed amount per sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {v.tax_mode === "fixed" ? field("tax_fixed", "Amount per sale", "number") : field("tax_percent", "Rate %", "number")}
              {v.tax_mode !== "fixed" && (
                <label className="flex items-center gap-2 text-sm sm:col-span-3">
                  <input type="checkbox" className="accent-primary" checked={!!v.tax_inclusive} onChange={(e) => set("tax_inclusive", e.target.checked)} />
                  Prices already include tax (inclusive)
                </label>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-4 rounded-xl border bg-secondary/40 p-4 sm:col-span-2 sm:grid-cols-2">
          <p className="font-medium sm:col-span-2">Customer loyalty points (0 = off)</p>
          {field("points_per_unit", "Points earned per 100 spent", "number")}
          {field("point_value", "Value of 1 point when redeemed", "number")}
        </div>
        <div className="grid gap-4 rounded-xl border bg-secondary/40 p-4 sm:col-span-2 sm:grid-cols-2">
          <p className="font-medium sm:col-span-2">Discount control</p>
          {field("max_discount_percent", "Max order discount % without manager PIN", "number")}
          {field("manager_pin", "Manager PIN (empty = no PIN)", "password")}
        </div>
        <div className="space-y-1.5">
          <Label>Financial year starts</Label>
          <Select value={String(v.fy_start_month)} onValueChange={(x) => set("fy_start_month", Number(x))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={busy}>{submitLabel}</Button>
    </form>
  );
}
