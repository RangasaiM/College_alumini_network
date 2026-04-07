-- Drop table if exists to ensure clean slate with correct FK
DROP TABLE IF EXISTS announcements;

-- Recreate announcements table with FK to public.users (CRITICAL for join queries)
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'all',
  images TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for now as requested
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
BEGIN;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  
  CREATE POLICY "Public Access" ON storage.objects FOR ALL 
  USING (bucket_id = 'announcement-images') 
  WITH CHECK (bucket_id = 'announcement-images');
COMMIT;

-- Permission grant (optional but good practice)
GRANT ALL ON TABLE announcements TO postgres, anon, authenticated, service_role;
