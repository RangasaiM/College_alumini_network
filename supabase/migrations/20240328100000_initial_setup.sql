-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and types
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.connection_status CASCADE;

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('student', 'alumni', 'admin');
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create users table
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    batch_year INTEGER,
    graduation_year INTEGER,
    department TEXT,
    current_company TEXT,
    current_position TEXT,
    location TEXT,
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    avatar_url TEXT,
    role public.user_role NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create connections table
CREATE TABLE public.connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status public.connection_status NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(requester_id, receiver_id)
);

-- Add RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    user_role public.user_role;
BEGIN
    SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
    RETURN user_role = 'admin';
END;
$$;

-- Create policies for users table
CREATE POLICY "Enable read access for authenticated users"
    ON public.users FOR SELECT
    USING (
        -- Allow if:
        -- 1. The profile is approved
        -- 2. It's the user's own profile
        -- 3. The requesting user is an admin
        is_approved = true OR 
        auth.uid() = id OR
        public.is_admin()
    );

CREATE POLICY "Enable update for users based on id"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Add RLS policies for connections table
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Create policies for connections table
CREATE POLICY "Enable read access for connection participants"
    ON public.connections FOR SELECT
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = receiver_id
    );

CREATE POLICY "Enable insert for authenticated users"
    ON public.connections FOR INSERT
    WITH CHECK (
        auth.uid() = requester_id AND
        requester_id != receiver_id AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = requester_id 
            AND is_approved = true
        )
    );

CREATE POLICY "Enable update for connection participants"
    ON public.connections FOR UPDATE
    USING (
        (auth.uid() = requester_id AND status = 'pending') OR
        (auth.uid() = receiver_id AND status = 'pending')
    );

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_approved ON public.users(is_approved);
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX idx_connections_status ON public.connections(status);

-- Add a function to handle timestamp updates
CREATE OR REPLACE FUNCTION public.handle_connection_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_connection_update();

CREATE TRIGGER update_connections_timestamp
    BEFORE UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_connection_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Allow authenticated users to use the tables
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.connections TO authenticated;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_connection_update TO authenticated; 