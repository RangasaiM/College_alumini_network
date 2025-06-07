ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS internships JSONB[],
    ADD COLUMN IF NOT EXISTS projects JSONB[],
    ADD COLUMN IF NOT EXISTS certifications JSONB[],
    ADD COLUMN IF NOT EXISTS academic_achievements TEXT[],
    ADD COLUMN IF NOT EXISTS areas_of_interest TEXT[],
    ADD COLUMN IF NOT EXISTS career_goals TEXT;

-- Grant permissions
GRANT SELECT, UPDATE (
    internships,
    projects,
    certifications,
    academic_achievements,
    areas_of_interest,
    career_goals
) ON public.users TO authenticated;