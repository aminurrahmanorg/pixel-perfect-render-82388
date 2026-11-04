ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_url text;
CREATE POLICY "own images select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own images insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own images update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own images delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);