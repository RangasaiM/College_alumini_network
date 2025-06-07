-- Drop existing update policies
DROP POLICY IF EXISTS "Enable users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable admins to update any profile" ON public.users;

-- Create new update policies with proper permissions
CREATE POLICY "Enable users to update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        CASE WHEN role = 'student' THEN
            COALESCE(batch_year, 0) > 0
        WHEN role = 'alumni' THEN
            COALESCE(graduation_year, 0) > 0
        ELSE
            true
        END
    );

CREATE POLICY "Enable admins to update any profile"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Grant necessary permissions
GRANT UPDATE ON public.users TO authenticated; 