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
    return <div className="py-8 text-center text-muted-foreground">Loading suggestions...</div>;
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {userRole === 'student' ? 'Suggested Alumni' : 'Suggested Students'}
          </h2>
          <p className="text-sm text-muted-foreground">Expand your professional network</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${userRole}/connections`}>View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const status = getConnectionStatus(user.id);
          return (
            <div key={user.id} className="group relative bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              {/* Custom Card Content for Professional Look */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar Placeholder or Image */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      user.name?.[0]
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold leading-none">{user.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{user.role}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Department: </span>
                  {user.department || 'N/A'}
                </div>
                {user.current_company && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Company: </span>
                    {user.current_company}
                  </div>
                )}
              </div>

              <div className="mt-auto">
                {!status ? (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleConnect(user.id);
                    }}
                  >
                    Connect
                  </Button>
                ) : (
                  <Button className="w-full" disabled variant="ghost">
                    {status === 'pending' || status === 'sent' ? 'Request Sent' :
                      status === 'received' ? 'Request Received' : 'Connected'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
} 