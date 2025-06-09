-- Create the profile photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to upload their profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own profile photos" ON storage.objects;

-- Create policies for profile photos
CREATE POLICY "Allow users to upload their profile photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile_photos');

CREATE POLICY "Allow public to view profile photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile_photos');

CREATE POLICY "Allow users to update their own profile photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own profile photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]); 