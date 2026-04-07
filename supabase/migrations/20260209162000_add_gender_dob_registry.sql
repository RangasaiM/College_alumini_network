-- Add gender and date_of_birth columns to college_registry
ALTER TABLE public.college_registry ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other'));
ALTER TABLE public.college_registry ADD COLUMN IF NOT EXISTS date_of_birth DATE;
