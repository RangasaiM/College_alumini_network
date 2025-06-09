-- Add image_url column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for post images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_images', 'post_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to post images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'post_images');

-- Allow authenticated users to upload post images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post_images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own post images
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post_images'
  AND auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)'))[1]
)
WITH CHECK (
  bucket_id = 'post_images'
  AND auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)'))[1]
);

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post_images'
  AND auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)'))[1]
); 