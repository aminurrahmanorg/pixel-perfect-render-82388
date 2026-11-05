import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Contact, Sparkles, LayoutDashboard, ShoppingCart, ShoppingBag, Receipt, Landmark, FileBarChart, Settings, LogOut, Store, HandCoins, ArrowLeftRight, History, Users, ChartColumn, MonitorSmartphone, Boxes, Lightbulb, Tags } from "lucide-react";
import { CASHIER_PAGES, useRestaurant, useRole } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_app")({
  beforeLoad: async ({ context }) => {
    const r = await context.queryClient.ensureQueryData({
      queryKey: ["restaurant"],
      queryFn: async () => (await supabase.from("restaurants").select("*").maybeSingle()).data,
    });
    if (!r) throw redirect({ to: "/setup" });
  },
  component: AppLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "POS", icon: MonitorSmartphone },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/insights", label: "AI Insights", icon: Lightbulb },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/menu", label: "Products", icon: ShoppingBag },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/income", label: "Other Income", icon: HandCoins },
  { to: "/accounts", label: "Accounts", icon: Landmark },
  { to: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  { to: "/customers", label: "Customers", icon: Contact },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/profit-loss", label: "Profit & Loss", icon: FileBarChart },
  { to: "/reports", label: "Reports", icon: ChartColumn },
  { to: "/activity", label: "Activity Log", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const { data: r } = useRestaurant();
  const { data: role } = useRole();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            {r?.logo_url ? (
              <img src={r.logo_url} alt="" className="size-9 rounded-lg object-cover" />
            ) : (
              <span className="grid size-9 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-sidebar-primary-foreground shadow-[var(--shadow-soft)]"><Store className="size-5" /></span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">{r?.name}</p>
              <p className="text-xs capitalize opacity-60">{role ?? "Manager Pro"}</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.filter((n) => role !== "cashier" || CASHIER_PAGES.includes(n.to)).map((n) => (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={path.startsWith(n.to)}>
                      <Link to={n.to}><n.icon /> <span>{n.label}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut}><LogOut /> <span>Sign out</span></SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{r?.currency} · {r?.time_zone}</span>
          <Button asChild size="sm" className="shrink-0"><Link to="/pos"><MonitorSmartphone /> Open POS</Link></Button>
        </header>
        <div className="p-4 md:p-8">{role === "cashier" && !CASHIER_PAGES.some((p) => path.startsWith(p)) ? <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center"><p className="font-display text-lg font-semibold">Not available for cashiers</p><p className="mt-1 text-sm text-muted-foreground">Ask the store owner for manager access.</p><Button asChild className="mt-4"><Link to="/pos">Go to POS</Link></Button></div> : <Outlet />}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
