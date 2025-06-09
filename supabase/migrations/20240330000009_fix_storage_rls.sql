-- Enable RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create buckets (you might want to restrict this in production)
CREATE POLICY "Allow users to create buckets"
ON storage.buckets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to see their buckets
CREATE POLICY "Allow users to view buckets"
ON storage.buckets
FOR SELECT
TO authenticated
USING (true);

-- Create the avatars bucket directly (bypassing RLS)
DO $$
BEGIN
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
    )
    ON CONFLICT (id) DO UPDATE SET 
        public = true,
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY[
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
END $$; 