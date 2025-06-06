-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create base tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('student', 'alumni', 'admin')),
  is_approved BOOLEAN DEFAULT false,
  batch_year INT,
  github_url TEXT,
  leetcode_url TEXT,
  linkedin_url TEXT,
  current_job TEXT,
  skills TEXT[],
  avatar_url TEXT,
  resume_url TEXT,
  department TEXT,
  graduation_year INT,
  is_mentorship_available BOOLEAN DEFAULT false,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id),
  receiver_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

-- 3. Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for users table
CREATE POLICY "Enable insert for users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for authenticated users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (is_approved = true OR auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Enable update for users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- 6. Create policies for announcements table
CREATE POLICY "Enable select for authenticated users"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admins"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Enable update for admins"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 7. Create policies for messages table
CREATE POLICY "Enable select for message participants"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Enable insert for authenticated users"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_is_approved_idx ON public.users(is_approved);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS announcements_admin_id_idx ON public.announcements(admin_id);

-- 10. Insert admin user
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Get the auth.uid for the admin email
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = 'rangasaimangalagiri@gmail.com';

    -- Insert or update the admin user
    INSERT INTO public.users (
        id,
        email,
        name,
        role,
        is_approved
    ) VALUES (
        admin_id,
        'rangasaimangalagiri@gmail.com',
        'Ranga Sai',
        'admin',
        true
    ) ON CONFLICT (email) DO UPDATE 
    SET role = 'admin',
        is_approved = true;
END $$; 