CREATE POLICY "Auth read faces" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'faces');
CREATE POLICY "Auth insert faces" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'faces');
CREATE POLICY "Auth update faces" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'faces');
CREATE POLICY "Auth delete faces" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'faces');