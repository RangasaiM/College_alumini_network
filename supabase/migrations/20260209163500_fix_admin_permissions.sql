-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant full access to admins
CREATE POLICY "Admins can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update all profiles"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Ensure all authenticated users can view all profiles (needed for directory/search)
-- This might overlap with the admin policy but ensures base visibility
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.users;
CREATE POLICY "Enable read access for all authenticated users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
