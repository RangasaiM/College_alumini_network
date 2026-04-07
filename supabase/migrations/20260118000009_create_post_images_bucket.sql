-- Create post_images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post_images', 'post_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post_images
BEGIN;
  -- Drop potential existing policies to ensure clean state
  DROP POLICY IF EXISTS "Public Access Post Images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update post images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete post images" ON storage.objects;
  
  -- Public access to read all post images
  CREATE POLICY "Public Access Post Images" ON storage.objects FOR SELECT
  USING (bucket_id = 'post_images');

  -- Users can upload their own post images (path must start with user_id)
  CREATE POLICY "Authenticated users can upload post images" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Users can update their own post images
  CREATE POLICY "Authenticated users can update post images" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
  
  -- Users can delete their own post images
  CREATE POLICY "Authenticated users can delete post images" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
COMMIT;
