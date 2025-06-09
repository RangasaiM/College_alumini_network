-- Check if storage extension exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_extension 
    WHERE extname = 'storage'
);

-- Check if storage schema exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'storage'
);

-- Check if buckets table exists and list all buckets
SELECT * FROM storage.buckets;

-- Check storage policies
SELECT * FROM pg_policies WHERE schemaname = 'storage';

-- Attempt to recreate storage extension and bucket if not exists
DO $$
BEGIN
    -- Create storage extension
    CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA extensions;
    
    -- Create storage schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS storage;
    
    -- Create storage buckets table if it doesn't exist
    CREATE TABLE IF NOT EXISTS storage.buckets (
        id text NOT NULL,
        name text NOT NULL,
        owner uuid,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        public boolean DEFAULT false,
        avif_autodetection boolean DEFAULT false,
        file_size_limit bigint,
        allowed_mime_types text[],
        CONSTRAINT buckets_pkey PRIMARY KEY (id)
    );

    -- Insert or update avatars bucket
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

    -- Create objects table if it doesn't exist
    CREATE TABLE IF NOT EXISTS storage.objects (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        bucket_id text,
        name text,
        owner uuid,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        last_accessed_at timestamp with time zone DEFAULT now(),
        metadata jsonb,
        path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
        CONSTRAINT objects_pkey PRIMARY KEY (id),
        CONSTRAINT objects_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
    );

    -- Enable RLS
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

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
    );

    DROP POLICY IF EXISTS "Allow users to update own avatar" ON storage.objects;
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

    DROP POLICY IF EXISTS "Allow users to delete own avatar" ON storage.objects;
    CREATE POLICY "Allow users to delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (REGEXP_MATCH(name, '^([^/]+)'))[1]
    );

END $$; 