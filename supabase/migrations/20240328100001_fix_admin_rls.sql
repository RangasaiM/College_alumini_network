-- Drop existing RLS policies and functions
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP FUNCTION IF EXISTS public.is_admin;

-- Create a more efficient admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    user_role public.user_role;
BEGIN
    SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
    RETURN user_role = 'admin';
END;
$$;

-- Create updated policy for users table
CREATE POLICY "Enable read access for authenticated users"
    ON public.users FOR SELECT
    USING (
        -- Allow if:
        -- 1. The profile is approved
        -- 2. It's the user's own profile
        -- 3. The requesting user is an admin
        is_approved = true OR 
        auth.uid() = id OR
        public.is_admin()
    ); 