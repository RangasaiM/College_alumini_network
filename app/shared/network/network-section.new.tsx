'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCard } from '@/app/shared/users/user-card';
import { toast } from 'sonner';

type NetworkSectionProps = {
  userRole: 'student' | 'alumni';
};

export function NetworkSection({ userRole }: NetworkSectionProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        setCurrentUserId(session.user.id);

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('role', userRole === 'student' ? 'alumni' : 'student')
          .eq('is_approved', true)
          .limit(3);

        if (usersError) throw usersError;

        // Fetch connections
        const { data: connectionsData, error: connectionsError } = await supabase
          .from('connections')
          .select('*')
          .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

        if (connectionsError) throw connectionsError;

        setUsers(usersData || []);
        setConnections(connectionsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch network data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, supabase]);

  const handleConnect = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('connections')
        .insert([
          {
            requester_id: session.user.id,
            receiver_id: userId,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast.success('Connection request sent');
      // Refresh connections
      const { data: connectionsData } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
      setConnections(connectionsData || []);
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const getConnectionStatus = (userId: string) => {
    if (!currentUserId) return null;

    const connection = connections.find(
      conn => 
        (conn.requester_id === currentUserId && conn.receiver_id === userId) ||
        (conn.requester_id === userId && conn.receiver_id === currentUserId)
    );

    if (!connection) return null;

    // If current user is the requester, show "Request Sent"
    if (connection.requester_id === currentUserId) {
      return connection.status === 'pending' ? 'sent' : connection.status;
    }
    
    // If current user is the receiver, show "Request Received"
    return connection.status === 'pending' ? 'received' : connection.status;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect with {userRole === 'student' ? 'Alumni' : 'Students'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => {
            const status = getConnectionStatus(user.id);
            return (
              <UserCard 
                key={user.id} 
                user={user}
                actions={
                  !status ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(user.id)}
                    >
                      Connect
                    </Button>
                  ) : status === 'sent' ? (
                    <span className="text-sm text-muted-foreground">Request Sent</span>
                  ) : status === 'received' ? (
                    <span className="text-sm text-muted-foreground">Request Received</span>
                  ) : status === 'accepted' ? (
                    <span className="text-sm text-green-500">Connected</span>
                  ) : null
                }
              />
            );
          })}
          <Button asChild className="w-full">
            <Link href="/discover">View More</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 