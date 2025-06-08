-- Create the bucket using storage.create_bucket()
SELECT storage.create_bucket('avatars', JSONB_BUILD_OBJECT(
    'public', true,
    'file_size_limit', 5242880,
    'allowed_mime_types', ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
));

-- Create policy for public access to view avatars
BEGIN;
SELECT storage.create_policy(
    'avatars',
    'SELECT',
    'authenticated',
    true,
    true -- public policy
);

-- Create policy for authenticated users to upload avatars
SELECT storage.create_policy(
    'avatars',
    'INSERT',
    'authenticated',
    true,
    false -- not public
);

-- Create policy for users to update their own avatars
SELECT storage.create_policy(
    'avatars',
    'UPDATE',
    'authenticated',
    storage.foldername(name) = auth.uid()::text,
    false -- not public
);

-- Create policy for users to delete their own avatars
SELECT storage.create_policy(
    'avatars',
    'DELETE',
    'authenticated',
    storage.foldername(name) = auth.uid()::text,
    false -- not public
);
COMMIT; 