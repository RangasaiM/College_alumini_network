-- Enable storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA extensions;

-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage tables if they don't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    CONSTRAINT buckets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    CONSTRAINT objects_pkey PRIMARY KEY (id),
    CONSTRAINT objects_buckets_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create or replace the storage.can_insert_object function
CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is authenticated
  IF auth.role() = 'authenticated' THEN
    -- Allow insert if bucket is 'avatars'
    IF bucketid = 'avatars' THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies
DROP POLICY IF EXISTS "Give public access to avatars" ON storage.objects;
CREATE POLICY "Give public access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND storage.can_insert_object(bucket_id, name, owner, metadata)
);

DROP POLICY IF EXISTS "Allow users to update own avatar" ON storage.objects;
CREATE POLICY "Allow users to update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
)
WITH CHECK (
    bucket_id = 'avatars'
    AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Allow users to delete own avatar" ON storage.objects;
CREATE POLICY "Allow users to delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
);

-- Create or update avatars bucket
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
GRANT EXECUTE ON FUNCTION storage.can_insert_object TO authenticated; 