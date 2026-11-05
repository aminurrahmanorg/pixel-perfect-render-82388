CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT public.current_store_owner(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_categories_owner_name_idx
  ON public.product_categories (owner_id, lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "store rows" ON public.product_categories;
CREATE POLICY "store rows" ON public.product_categories
  FOR ALL TO authenticated
  USING (owner_id = public.current_store_owner())
  WITH CHECK (owner_id = public.current_store_owner());

INSERT INTO public.product_categories (owner_id, name)
SELECT DISTINCT ON (m.owner_id, lower(trim(m.category)))
  m.owner_id, trim(m.category)
FROM public.menu_items AS m
WHERE trim(m.category) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_categories AS c
    WHERE c.owner_id = m.owner_id
      AND lower(c.name) = lower(trim(m.category))
  )
ORDER BY m.owner_id, lower(trim(m.category)), trim(m.category);

NOTIFY pgrst, 'reload schema';
