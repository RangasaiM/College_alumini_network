/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text, enum: 'student', 'alumni', 'admin')
      - `is_approved` (boolean, default: false)
      - `batch_year` (int, for students)
      - `github_url` (text, for students)
      - `leetcode_url` (text, for students)
      - `linkedin_url` (text, for alumni/students)
      - `current_job` (text, for alumni)
      - `skills` (text[], array of skills)
      - `avatar_url` (text, for profile pictures)
      - `resume_url` (text, for uploaded resumes)
      - `department` (text, for students)
      - `graduation_year` (int, for alumni)
      - `is_mentorship_available` (boolean, for alumni)
      - `bio` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for:
      - Authenticated users can read all approved users
      - Users can update their own data
      - Admin can read all users (approved and unapproved)
*/

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all approved users
CREATE POLICY "Authenticated users can read approved users"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Admin can read all users (for approval)
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Policy: Admin can update any user
CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );