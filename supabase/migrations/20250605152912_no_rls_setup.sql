-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.announcements;
DROP TABLE IF EXISTS public.users;

-- Create tables without RLS
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT,
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

-- Grant all permissions to all roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert admin user
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