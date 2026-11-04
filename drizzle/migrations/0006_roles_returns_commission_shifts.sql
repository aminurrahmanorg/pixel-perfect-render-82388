ALTER TABLE public.store_members ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'manager' CHECK (role IN ('manager','cashier'));
CREATE OR REPLACE FUNCTION public.current_store_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role FROM store_members WHERE member_id = auth.uid() LIMIT 1), 'owner');
$$;
GRANT EXECUTE ON FUNCTION public.current_store_role() TO authenticated;
CREATE OR REPLACE FUNCTION public.list_team() RETURNS TABLE (id uuid, member_id uuid, email text, role text, created_at timestamptz) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT sm.id, sm.member_id, u.email::text, sm.role, sm.created_at FROM store_members sm JOIN auth.users u ON u.id = sm.member_id
  WHERE sm.store_owner_id = auth.uid() OR sm.member_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.list_team() TO authenticated;
CREATE OR REPLACE FUNCTION public.set_member_role(p_id uuid, p_role text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_role NOT IN ('manager','cashier') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  UPDATE store_members SET role = p_role WHERE id = p_id AND store_owner_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found or not allowed'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, text) TO authenticated;

CREATE POLICY "only owner/manager edit store" ON public.restaurants AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.current_store_role() IN ('owner','manager'));
CREATE POLICY "cashier cannot delete sales" ON public.sales AS RESTRICTIVE FOR DELETE TO authenticated USING (public.current_store_role() IN ('owner','manager'));
CREATE POLICY "cashier cannot delete expenses" ON public.expenses AS RESTRICTIVE FOR DELETE TO authenticated USING (public.current_store_role() IN ('owner','manager'));
CREATE POLICY "cashier cannot delete products" ON public.menu_items AS RESTRICTIVE FOR DELETE TO authenticated USING (public.current_store_role() IN ('owner','manager'));

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent <= 100);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS salesperson_id uuid REFERENCES public.staff(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS shift_id uuid;

CREATE TABLE public.sale_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT public.current_store_owner(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  qty numeric NOT NULL CHECK (qty > 0),
  refund numeric NOT NULL DEFAULT 0 CHECK (refund >= 0),
  cost numeric NOT NULL DEFAULT 0,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  restock boolean NOT NULL DEFAULT true,
  reason text,
  return_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_returns TO authenticated;
GRANT ALL ON public.sale_returns TO service_role;
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store rows" ON public.sale_returns FOR ALL TO authenticated USING (owner_id = public.current_store_owner()) WITH CHECK (owner_id = public.current_store_owner());

CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT public.current_store_owner(),
  opened_by uuid NOT NULL DEFAULT auth.uid(),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_cash numeric NOT NULL DEFAULT 0,
  expected_cash numeric,
  closing_cash numeric,
  note text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store rows" ON public.shifts FOR ALL TO authenticated USING (owner_id = public.current_store_owner()) WITH CHECK (owner_id = public.current_store_owner());

CREATE OR REPLACE FUNCTION public.sale_return_restock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.restock AND NEW.menu_item_id IS NOT NULL AND EXISTS (SELECT 1 FROM menu_items WHERE id = NEW.menu_item_id AND track_stock) THEN
    INSERT INTO stock_moves(owner_id, menu_item_id, qty, kind, unit_cost, sale_id) VALUES (NEW.owner_id, NEW.menu_item_id, NEW.qty, 'return', NEW.cost, NEW.sale_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sale_returns_restock AFTER INSERT ON public.sale_returns FOR EACH ROW EXECUTE FUNCTION public.sale_return_restock();