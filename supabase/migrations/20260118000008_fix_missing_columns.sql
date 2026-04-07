-- Add skills and missing social/coding URLs
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS leetcode_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Verify other potentially missing fields just in case
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
