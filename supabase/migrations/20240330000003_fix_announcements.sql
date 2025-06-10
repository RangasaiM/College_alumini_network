-- Drop existing announcements table if it exists
DROP TABLE IF EXISTS public.announcements;

-- Create announcements table with proper schema
CREATE TABLE public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    target_roles TEXT[] NOT NULL DEFAULT ARRAY['all'],
    target_role text NOT NULL DEFAULT 'all',
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
CREATE POLICY "Enable read access for all authenticated users"
    ON public.announcements FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for admins"
    ON public.announcements FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Enable update for admins"
    ON public.announcements FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Enable delete for admins"
    ON public.announcements FOR DELETE
    USING (public.is_admin());

-- Create trigger for updating timestamps
CREATE TRIGGER update_announcements_timestamp
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_connection_update();

-- Grant necessary permissions
GRANT SELECT ON public.announcements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

-- Add check constraint to ensure valid target_role values
ALTER TABLE public.announcements 
ADD CONSTRAINT valid_target_role CHECK (target_role IN ('all', 'student', 'alumni')); 