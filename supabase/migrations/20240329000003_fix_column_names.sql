-- Rename columns to match the form fields
ALTER TABLE public.users 
  RENAME COLUMN current_role TO current_position;

ALTER TABLE public.users 
  RENAME COLUMN experience_years TO years_of_experience;

ALTER TABLE public.users 
  RENAME COLUMN portfolio_url TO website_url;

-- Update RLS policies to use new column names
GRANT SELECT, UPDATE (current_position, years_of_experience, website_url) ON public.users TO authenticated; 