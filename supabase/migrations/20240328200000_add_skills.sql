-- Add skills column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Update RLS policies to include skills
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;

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

CREATE POLICY "Enable update for users based on id"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated; 