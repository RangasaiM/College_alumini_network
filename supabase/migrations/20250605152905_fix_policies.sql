-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view approved users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Create a function to check if a user is an admin
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

-- Create new policies for users table
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

-- Create policies for announcements table
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

-- Create policies for messages table
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert or update admin user
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
) ON CONFLICT (email) DO UPDATE 
SET role = 'admin',
    is_approved = true; 