-- Create policies for the avatars bucket
BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatar" ON storage.objects;

-- Create policy to allow public access to view avatars
CREATE POLICY "Give public access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Create policy to allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
);

-- Create policy to allow users to update their own avatars
CREATE POLICY "Allow users to update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)'))[1]
)
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)'))[1]
);

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Allow users to delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)'))[1]
);

-- Update bucket settings
UPDATE storage.buckets
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
WHERE id = 'avatars';

COMMIT; 