-- Add roll_number column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Update RLS policies to include roll_number
GRANT SELECT, UPDATE (roll_number) ON public.users TO authenticated; 