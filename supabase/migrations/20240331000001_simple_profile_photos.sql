-- Enable storage
CREATE EXTENSION IF NOT EXISTS "storage";

-- Create a simple bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their profile photos
CREATE POLICY "Allow users to upload their profile photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile_photos');

-- Allow public access to profile photos
CREATE POLICY "Allow public to view profile photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile_photos'); 