-- Drop dependent policies first
DROP POLICY IF EXISTS "Enable admins to update any profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.announcements;
DROP POLICY IF EXISTS "Enable update for admins" ON public.announcements;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.announcements;

-- Drop all existing is_admin functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Create a single, properly defined is_admin function
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

-- Recreate the policies
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

CREATE POLICY "Enable admins to update any profile"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Enable insert for admins"
    ON public.announcements FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Enable update for admins"
    ON public.announcements FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Enable delete for admins"
    ON public.announcements FOR DELETE
    USING (public.is_admin());

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated; 