-- Enable RLS on users just in case
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view profiles
-- Drop first to avoid conflict or duplicate
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Re-create the policy to ensure everyone can read user profiles (needed for feed)
CREATE POLICY "Enable read access for all authenticated users" 
ON public.users FOR SELECT 
TO authenticated 
USING (true);
