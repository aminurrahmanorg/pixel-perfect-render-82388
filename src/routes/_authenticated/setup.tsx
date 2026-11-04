import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantForm } from "@/components/RestaurantForm";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/setup")({
  head: () => ({ meta: [{ title: "Set up your business — Business Manager Pro" }] }),
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();
  const [busy, setBusy] = useState(false);
  const [sample, setSample] = useState(true);
  const [checking, setChecking] = useState(true);

  // If this account already has a store (own or via team membership), go straight to the app.
  useEffect(() => {
    let on = true;
    supabase
      .from("restaurants")
      .select("id")
      .maybeSingle()
      .then(({ data }) => {
        if (!on) return;
        if (data) navigate({ to: "/dashboard", replace: true });
        else setChecking(false);
      });
    return () => {
      on = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your store…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-brand text-primary-foreground"><Store /></span>
          <div>
            <h1 className="text-2xl font-semibold">Set up your business</h1>
            <p className="text-sm text-muted-foreground">You can change any of this later in Settings.</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <label className="mb-6 flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm">
            <Checkbox checked={sample} onCheckedChange={(c) => setSample(!!c)} />
            Add sample menu, sales and expenses so I can explore (you can delete them later)
          </label>
          <RestaurantForm
            initial={{ email: user.email ?? "" }}
            submitLabel="Finish setup"
            busy={busy}
            onSubmit={async (v) => {
              setBusy(true);
              const { error } = await supabase.from("restaurants").insert(v);
              if (error) { setBusy(false); return void toast.error(error.message); }
              if (sample) {
                const { error: e2 } = await supabase.rpc("seed_sample_data");
                if (e2) toast.error(e2.message);
              } else {
                await supabase.from("accounts").insert([
                  { name: "Cash Drawer", type: "cash" },
                  { name: "Bank", type: "bank" },
                  { name: "Mobile Wallet", type: "wallet" },
                ]);
              }
              await qc.invalidateQueries();
              navigate({ to: "/dashboard" });
            }}
          />
        </div>
      </div>
    </div>
  );
}
