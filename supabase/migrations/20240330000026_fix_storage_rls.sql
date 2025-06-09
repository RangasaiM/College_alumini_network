-- Temporarily disable RLS on storage.objects for testing
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Give public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatar" ON storage.objects;

-- Create a single permissive policy for testing
CREATE POLICY "Allow all operations on avatars bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

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

-- Grant full permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO anon; 