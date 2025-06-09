-- Enable storage by creating an extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "storage";

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;

-- Create new policies
-- Allow public access to view avatars
CREATE POLICY "Give public access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
);

-- Allow users to update their own avatars
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

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)'))[1]
); 