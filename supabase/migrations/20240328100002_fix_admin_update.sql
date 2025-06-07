-- Create or replace the is_admin function
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

-- Drop existing update policy
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;

-- Create new update policies
CREATE POLICY "Enable users to update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable admins to update any profile"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated; 