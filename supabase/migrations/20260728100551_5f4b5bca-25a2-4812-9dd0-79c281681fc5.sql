CREATE POLICY "own entry media read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'entry-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own entry media insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'entry-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own entry media update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'entry-media' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'entry-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own entry media delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'entry-media' AND auth.uid()::text = (storage.foldername(name))[1]);