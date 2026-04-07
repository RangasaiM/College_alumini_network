-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'all',
  images TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- Create bucket for announcement images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (Required for storage to work)
BEGIN;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  
  CREATE POLICY "Public Access" ON storage.objects FOR ALL 
  USING (bucket_id = 'announcement-images') 
  WITH CHECK (bucket_id = 'announcement-images');
COMMIT;
