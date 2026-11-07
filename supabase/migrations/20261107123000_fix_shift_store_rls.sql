ALTER TABLE public.shifts
  ALTER COLUMN owner_id SET DEFAULT public.current_store_owner();

DROP POLICY IF EXISTS "store rows" ON public.shifts;
CREATE POLICY "store rows" ON public.shifts
  FOR ALL TO authenticated
  USING (owner_id = public.current_store_owner())
  WITH CHECK (owner_id = public.current_store_owner());

NOTIFY pgrst, 'reload schema';
