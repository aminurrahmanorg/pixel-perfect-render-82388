ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_amount numeric,
  ADD COLUMN IF NOT EXISTS points_redeemed numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salesperson_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shift_id uuid;

CREATE INDEX IF NOT EXISTS sales_customer_id_idx ON public.sales(customer_id);

NOTIFY pgrst, 'reload schema';
