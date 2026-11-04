ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS manager_pin text,
  ADD COLUMN IF NOT EXISTS max_discount_percent numeric NOT NULL DEFAULT 10;

NOTIFY pgrst, 'reload schema';
