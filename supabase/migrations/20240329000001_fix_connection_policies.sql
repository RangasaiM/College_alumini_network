-- Drop the existing update policy
DROP POLICY IF EXISTS "Enable update for connection participants" ON public.connections;

-- Create a new update policy that allows:
-- 1. Requester to update their own pending requests
-- 2. Receiver to accept/reject pending requests
CREATE POLICY "Enable update for connection participants"
    ON public.connections FOR UPDATE
    USING (
        (auth.uid() = requester_id AND status = 'pending') OR
        (auth.uid() = receiver_id AND status = 'pending')
    )
    WITH CHECK (
        (auth.uid() = requester_id AND status = 'pending') OR
        (auth.uid() = receiver_id AND status = 'pending')
    );

-- Create a new policy specifically for accepting connections
CREATE POLICY "Enable accepting connections"
    ON public.connections FOR UPDATE
    USING (
        auth.uid() = receiver_id AND
        status = 'pending'
    )
    WITH CHECK (
        auth.uid() = receiver_id AND
        status = 'accepted'
    ); 