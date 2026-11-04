ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS manager_pin text, ADD COLUMN IF NOT EXISTS max_discount_percent numeric NOT NULL DEFAULT 10;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sku text, ADD COLUMN IF NOT EXISTS barcode text, ADD COLUMN IF NOT EXISTS track_stock boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS stock_qty numeric NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS low_stock_at numeric NOT NULL DEFAULT 5;
CREATE TABLE public.stock_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT public.current_store_owner(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  qty numeric NOT NULL,
  kind text NOT NULL DEFAULT 'purchase',
  unit_cost numeric NOT NULL DEFAULT 0,
  supplier text,
  note text,
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  move_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_moves TO authenticated;
GRANT ALL ON public.stock_moves TO service_role;
ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store rows" ON public.stock_moves FOR ALL TO authenticated USING (owner_id = public.current_store_owner()) WITH CHECK (owner_id = public.current_store_owner());
CREATE OR REPLACE FUNCTION public.apply_stock_move() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE menu_items SET stock_qty = stock_qty + NEW.qty WHERE id = NEW.menu_item_id; RETURN NEW;
  ELSE UPDATE menu_items SET stock_qty = stock_qty - OLD.qty WHERE id = OLD.menu_item_id; RETURN OLD; END IF;
END $$;
CREATE TRIGGER stock_moves_apply AFTER INSERT OR DELETE ON public.stock_moves FOR EACH ROW EXECUTE FUNCTION public.apply_stock_move();
CREATE OR REPLACE FUNCTION public.sale_item_stock_out() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s_owner uuid;
BEGIN
  IF NEW.menu_item_id IS NULL THEN RETURN NEW; END IF;
  SELECT owner_id INTO s_owner FROM menu_items WHERE id = NEW.menu_item_id AND track_stock;
  IF s_owner IS NOT NULL THEN
    INSERT INTO stock_moves(owner_id, menu_item_id, qty, kind, unit_cost, sale_id) VALUES (s_owner, NEW.menu_item_id, -NEW.qty, 'sale', NEW.cost, NEW.sale_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sale_items_stock_out AFTER INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.sale_item_stock_out();