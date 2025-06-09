-- Drop existing update policies
DROP POLICY IF EXISTS "Enable users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable admins to update any profile" ON public.users;

-- Create new update policies with proper permissions
CREATE POLICY "Enable users to update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable admins to update any profile"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Ensure avatar_url is included in the RLS permissions
GRANT SELECT, UPDATE (
    avatar_url,
    updated_at
) ON public.users TO authenticated; 