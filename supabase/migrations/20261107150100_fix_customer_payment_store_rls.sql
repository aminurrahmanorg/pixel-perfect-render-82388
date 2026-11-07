ALTER TABLE public.customer_payments
  ALTER COLUMN owner_id SET DEFAULT public.current_store_owner();

DROP POLICY IF EXISTS "own rows" ON public.customer_payments;
DROP POLICY IF EXISTS "store rows" ON public.customer_payments;
CREATE POLICY "store rows" ON public.customer_payments
  FOR ALL TO authenticated
  USING (owner_id = public.current_store_owner())
  WITH CHECK (owner_id = public.current_store_owner());

NOTIFY pgrst, 'reload schema';
