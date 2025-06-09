-- Add any missing columns to users table
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS batch_year INTEGER,
    ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
    ADD COLUMN IF NOT EXISTS current_company TEXT,
    ADD COLUMN IF NOT EXISTS current_position TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
    ADD COLUMN IF NOT EXISTS github_url TEXT,
    ADD COLUMN IF NOT EXISTS twitter_url TEXT,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Update RLS policies to include new columns
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