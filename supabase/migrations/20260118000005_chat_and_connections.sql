-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- RLS for connections
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
  ON connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert connection requests"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own received requests"
  ON connections FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = requester_id); -- requester might cancel? usually delete. receiver accepts/rejects.

CREATE POLICY "Users can delete their own connections"
  ON connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);


-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages (mark as read)"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id); -- Only receiver marks as read usually.

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- Note: 'supabase_realtime' publication usually exists. If not, create it.
-- DO NOT FAIL if it exists.
-- Better way is typically via dashboard, but SQL can try:
-- CREATE PUBLICATION supabase_realtime FOR TABLE messages; 
-- But adding to default is common.
