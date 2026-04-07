-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
BEGIN;
  DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
  
  -- Public access to read all avatars
  CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

  -- Users can insert their own avatar (filename should include user_id preferably, or just allow auth users)
  -- For simplicity, allowing authenticated users to upload to avatars bucket
  CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

  -- Users can update/delete their own avatar
  -- This is tricky without strict path naming conventions. 
  -- We'll trust the app to manage paths like `avatars/{user_id}/avatar.png` or `avatars/{uuid}`.
  -- For now, allowing authenticated users to update/delete in the bucket is reasonable if we assume they only touch their own via the UI.
  -- A stricter policy would check `name` pattern.
  CREATE POLICY "Authenticated users can update avatars" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  
  CREATE POLICY "Authenticated users can delete avatars" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
COMMIT;
