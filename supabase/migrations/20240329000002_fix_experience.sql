-- Drop the old experience column
ALTER TABLE public.users DROP COLUMN IF EXISTS experience;

-- Add years_of_experience column
ALTER TABLE public.users ADD COLUMN years_of_experience INTEGER;

-- Update RLS policies to include the new column
GRANT SELECT, UPDATE (years_of_experience) ON public.users TO authenticated; 