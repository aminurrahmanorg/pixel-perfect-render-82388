CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT public.current_store_owner(),
  name text NOT NULL,
  phone text, email text, address text,
  tier text NOT NULL DEFAULT 'Regular',
  points numeric NOT NULL DEFAULT 0,
  credit_limit numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store rows" ON public.customers FOR ALL TO authenticated
  USING (owner_id = public.current_store_owner()) WITH CHECK (owner_id = public.current_store_owner());

CREATE TABLE public.customer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT public.current_store_owner(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  account_id uuid REFERENCES public.accounts(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_payments TO authenticated;
GRANT ALL ON public.customer_payments TO service_role;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store rows" ON public.customer_payments FOR ALL TO authenticated
  USING (owner_id = public.current_store_owner()) WITH CHECK (owner_id = public.current_store_owner());

ALTER TABLE public.sales ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN paid_amount numeric;
ALTER TABLE public.sales ADD COLUMN points_redeemed numeric NOT NULL DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN points_per_unit numeric NOT NULL DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN point_value numeric NOT NULL DEFAULT 0;

CREATE TRIGGER log_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER log_customer_payments AFTER INSERT OR UPDATE OR DELETE ON public.customer_payments FOR EACH ROW EXECUTE FUNCTION public.log_activity();