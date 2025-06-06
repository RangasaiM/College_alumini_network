-- First, clean up everything
DROP POLICY IF EXISTS "Enable insert for users" ON public.users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users" ON public.users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.announcements;
DROP POLICY IF EXISTS "Enable update for admins" ON public.announcements;
DROP POLICY IF EXISTS "Enable select for message participants" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
DROP FUNCTION IF EXISTS public.is_admin;

-- Recreate tables with clean slate
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.announcements;
DROP TABLE IF EXISTS public.users;

-- Create tables
CREATE TABLE public.users (
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

CREATE TABLE public.announcements (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID REFERENCES public.users(id)
);

CREATE TABLE public.messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id),
  receiver_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Simple policies for users table
CREATE POLICY "Allow full access to admin users"
  ON public.users
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Allow users to see approved profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Allow users to see and edit their own profile"
  ON public.users
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Simple policies for announcements
CREATE POLICY "Allow everyone to view announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage announcements"
  ON public.announcements
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Simple policies for messages
CREATE POLICY "Allow users to manage their own messages"
  ON public.messages
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create initial admin user
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  is_approved
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'rangasaimangalagiri@gmail.com'),
  'rangasaimangalagiri@gmail.com',
  'Ranga Sai',
  'admin',
  true
);

-- Create temporary policy to allow initial setup
CREATE POLICY "Temporary allow all"
  ON public.users
  TO authenticated
  USING (true)
  WITH CHECK (true); 