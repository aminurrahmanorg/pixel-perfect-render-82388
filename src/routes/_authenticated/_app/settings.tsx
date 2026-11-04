import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel } from "@/components/PageHeader";
import { RestaurantForm } from "@/components/RestaurantForm";
import { useRefresh, useRestaurant } from "@/lib/data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Business Manager Pro" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: r } = useRestaurant();
  const { user } = Route.useRouteContext();
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  if (!r) return null;
  const userId = user.id;
  const { id, owner_id: _o, created_at: _c, ...initial } = r;
  return (
    <div>
      <PageHeader title="Settings" subtitle="Business profile, currency and tax" />
      <Panel className="max-w-3xl">
        <RestaurantForm initial={initial} submitLabel="Save changes" busy={busy} onSubmit={async (v) => {
          setBusy(true);
          const { error } = await supabase.from("restaurants").update(v).eq("id", id);
          setBusy(false);
          if (error) return void toast.error(error.message);
          toast.success("Settings saved");
          refresh();
        }} />
      </Panel>
      <TeamPanel isOwner={r.owner_id === userId} />
      <Panel className="mt-6 max-w-3xl" title="Sample data">
        <p className="mb-3 text-sm text-muted-foreground">Fill the app with 60 days of demo products, sales, expenses, income and transfers. Only works when you have no products yet.</p>
        <Button variant="outline" onClick={async () => {
          const { error } = await supabase.rpc("seed_sample_data");
          if (error) return void toast.error(error.message);
          toast.success("Sample data loaded"); refresh();
        }}>Load sample data</Button>
      </Panel>
    </div>
  );
}

type Member = { id: string; member_id: string; email: string; role: string; created_at: string };

function TeamPanel({ isOwner }: { isOwner: boolean }) {
  const refresh = useRefresh();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: members, refetch } = useQuery({
    queryKey: ["store_members"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_team");
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  async function addMember() {
    const e = email.trim();
    if (!e) return void toast.error("Enter an email address");
    setBusy(true);
    const { error } = await supabase.rpc("add_store_member_by_email", { p_email: e });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(`${e} can now access your store`);
    setEmail("");
    refetch();
    refresh();
  }

  async function removeMember(m: Member) {
    const { error } = await supabase.rpc("remove_store_member", { p_id: m.id });
    if (error) return void toast.error(error.message);
    toast.success(`${m.email} removed`);
    refetch();
  }

  return (
    <Panel className="mt-6 max-w-3xl" title="Team access">
      <p className="mb-4 text-sm text-muted-foreground">
        People you add here sign in with their own account and see this store. Managers can do everything except manage the team; cashiers only see POS, Sales, Customers, Products and Inventory and can't delete records.
        They must sign up first with the same email.
      </p>
      {isOwner && (
        <div className="mb-4 flex gap-2">
          <Input type="email" placeholder="teammate@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMember())} />
          <Button onClick={addMember} disabled={busy}><UserPlus /> Add</Button>
        </div>
      )}
      {members && members.length > 0 ? (
        <ul className="divide-y rounded-xl border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"><Users className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.email}</p>
                <p className="text-xs text-muted-foreground">Added {new Date(m.created_at).toLocaleDateString()}</p>
              </div>
              {isOwner ? (
                <select className="h-9 rounded-full border bg-background px-3 text-sm" value={m.role} aria-label={`Role for ${m.email}`} onChange={async (e) => {
                  const { error } = await supabase.rpc("set_member_role", { p_id: m.id, p_role: e.target.value });
                  if (error) toast.error(error.message); else { toast.success("Role updated"); refetch(); }
                }}><option value="manager">Manager</option><option value="cashier">Cashier</option></select>
              ) : <span className="text-xs capitalize text-muted-foreground">{m.role}</span>}
              {isOwner && (
                <Button variant="ghost" size="icon" onClick={() => removeMember(m)} aria-label={`Remove ${m.email}`}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      )}
    </Panel>
  );
}
