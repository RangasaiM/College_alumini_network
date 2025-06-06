/*
  # Create messages table for one-on-one chats

  1. New Tables
    - `messages`
      - `id` (serial, primary key)
      - `sender_id` (uuid, references users(id))
      - `receiver_id` (uuid, references users(id))
      - `content` (text)
      - `created_at` (timestamp)
      - `is_read` (boolean, default: false)

  2. Security
    - Enable RLS on `messages` table
    - Add policies for:
      - Users can read messages they've sent or received
      - Users can insert messages (send)
      - Users can update only the is_read status of messages they've received
*/

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages they've sent or received
CREATE POLICY "Users can read their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

-- Policy: Users can insert messages (send)
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update only the is_read status of messages they've received
CREATE POLICY "Users can mark messages as read"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    -- Only the is_read field can be updated
    (OLD.sender_id = NEW.sender_id) AND
    (OLD.receiver_id = NEW.receiver_id) AND
    (OLD.content = NEW.content) AND
    (OLD.created_at = NEW.created_at)
  );