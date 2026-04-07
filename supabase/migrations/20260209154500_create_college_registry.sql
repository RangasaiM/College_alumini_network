-- Create college_registry table
CREATE TABLE IF NOT EXISTS public.college_registry (
    roll_number TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    department TEXT, -- CSE, ECE, etc.
    graduation_year INTEGER, -- For both students and alumni
    role TEXT NOT NULL DEFAULT 'student', -- 'student' or 'alumni'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



-- Create policy for admins to insert/update/delete
-- Assuming we have an 'admin' role check or ignoring for now as manual DB entry might be expected
-- But ideally:
-- CREATE POLICY "Admins can manage registry" ON public.college_registry
-- USING (auth.jwt() ->> 'role' = 'admin'); 
