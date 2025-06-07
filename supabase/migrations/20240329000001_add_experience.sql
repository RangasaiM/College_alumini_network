-- Add experience column to users table
ALTER TABLE public.users ADD COLUMN experience TEXT[];

-- Update RLS policies to include the new column
GRANT SELECT, UPDATE (experience) ON public.users TO authenticated; 