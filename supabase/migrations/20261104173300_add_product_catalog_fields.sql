ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_percent numeric,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS track_stock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_qty numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_at numeric NOT NULL DEFAULT 5;

NOTIFY pgrst, 'reload schema';
