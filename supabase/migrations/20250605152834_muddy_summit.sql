/*
  # Create announcements table

  1. New Tables
    - `announcements`
      - `id` (serial, primary key)
      - `title` (text)
      - `content` (text)
      - `created_at` (timestamp)
      - `admin_id` (uuid, references users(id))

  2. Security
    - Enable RLS on `announcements` table
    - Add policies for:
      - All authenticated users can read announcements
      - Only admins can insert, update, or delete announcements
*/

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID REFERENCES users(id)
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read announcements
CREATE POLICY "Authenticated users can read announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert announcements
CREATE POLICY "Admins can insert announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy: Only admins can update announcements
CREATE POLICY "Admins can update announcements"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy: Only admins can delete announcements
CREATE POLICY "Admins can delete announcements"
  ON announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );