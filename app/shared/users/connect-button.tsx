'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';

interface ConnectButtonProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export function ConnectButton({ userId, userName, onSuccess }: ConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleConnect = async () => {
    try {
      setIsLoading(true);

      // Get current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      if (!session?.user?.id) {
        toast.error('Please sign in to connect');
        return;
      }

      console.log('Current user:', session.user.id);
      console.log('Connecting with user:', userId);

      // Check if connection already exists in either direction
      const { data: existingConnection, error: checkError } = await supabase
        .from('connections')
        .select('*')
        .or(
          `and(requester_id.eq.${session.user.id},receiver_id.eq.${userId}),` +
          `and(requester_id.eq.${userId},receiver_id.eq.${session.user.id})`
        )
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking existing connection:', checkError);
        throw checkError;
      }

      if (existingConnection) {
        console.log('Existing connection found:', existingConnection);
        toast.error('Connection already exists');
        return;
      }

      // Create new connection request
      const { data: newConnection, error: insertError } = await supabase
        .from('connections')
        .insert({
          requester_id: session.user.id,
          receiver_id: userId,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating connection:', insertError);
        throw insertError;
      }

      console.log('New connection created:', newConnection);
      toast.success(`Connection request sent to ${userName}`);
      onSuccess?.();
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send connection request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? 'Sending...' : 'Connect'}
    </Button>
  );
} 