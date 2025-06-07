ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS leetcode_url TEXT,
    ADD COLUMN IF NOT EXISTS codechef_url TEXT,
    ADD COLUMN IF NOT EXISTS hackerrank_url TEXT,
    ADD COLUMN IF NOT EXISTS codeforces_url TEXT;

-- Grant permissions
GRANT SELECT, UPDATE (
    leetcode_url,
    codechef_url,
    hackerrank_url,
    codeforces_url
) ON public.users TO authenticated;