ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS tax_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_mode text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS tax_fixed numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_label text NOT NULL DEFAULT 'VAT',
  ADD COLUMN IF NOT EXISTS tax_inclusive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS points_per_unit numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS point_value numeric NOT NULL DEFAULT 0;

UPDATE public.restaurants
SET tax_enabled = true
WHERE tax_percent > 0;

NOTIFY pgrst, 'reload schema';
