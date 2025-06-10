-- Drop existing announcements table
DROP TABLE IF EXISTS public.announcements CASCADE;

-- Create announcements table with proper schema
CREATE TABLE public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT NOT NULL DEFAULT 'all',
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_target_role CHECK (target_role IN ('all', 'student', 'alumni'))
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
CREATE POLICY "Enable read access for all authenticated users"
    ON public.announcements FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admins"
    ON public.announcements FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ));

CREATE POLICY "Enable update for admins"
    ON public.announcements FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ));

CREATE POLICY "Enable delete for admins"
    ON public.announcements FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ));

-- Grant necessary permissions
GRANT SELECT ON public.announcements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated; 