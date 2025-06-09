-- Drop existing storage policies
DROP POLICY IF EXISTS "Give public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatar" ON storage.objects;

-- Create new storage policies with metadata checks
CREATE POLICY "Give public access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (metadata->>'userId')::uuid = auth.uid()
);

-- Allow users to update their own avatars
CREATE POLICY "Allow users to update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND (metadata->>'userId')::uuid = auth.uid()
)
WITH CHECK (
    bucket_id = 'avatars'
    AND (metadata->>'userId')::uuid = auth.uid()
);

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND (metadata->>'userId')::uuid = auth.uid()
);

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
) ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated; 