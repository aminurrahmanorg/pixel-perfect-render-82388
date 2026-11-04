CREATE TABLE public.store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL,
  member_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_members TO authenticated;
GRANT ALL ON public.store_members TO service_role;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own membership" ON public.store_members FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR store_owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.current_store_owner()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT store_owner_id FROM public.store_members WHERE member_id = auth.uid()), auth.uid())
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['accounts','expenses','income','menu_items','restaurants','sale_items','sales','staff','transfers'] LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN owner_id SET DEFAULT public.current_store_owner()', t);
    EXECUTE format('DROP POLICY IF EXISTS "own rows" ON public.%I', t);
    EXECUTE format('CREATE POLICY "store rows" ON public.%I FOR ALL TO authenticated USING (owner_id = public.current_store_owner()) WITH CHECK (owner_id = public.current_store_owner())', t);
  END LOOP;
END $$;
DROP POLICY IF EXISTS "own logs" ON public.activity_logs;
CREATE POLICY "store logs" ON public.activity_logs FOR SELECT TO authenticated USING (owner_id = public.current_store_owner());