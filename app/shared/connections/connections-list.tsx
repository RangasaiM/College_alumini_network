'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  current_company: string | null;
  current_position: string | null;
  avatar_url: string | null;
}

interface Connection {
  id: string;
  status: 'pending' | 'accepted';
  requester: User;
  receiver: User;
}

interface ConnectionsListProps {
  connections: Connection[];
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function ConnectionsList({ connections: initialConnections, onAccept, onReject, onRemove }: ConnectionsListProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [connections, setConnections] = useState(initialConnections);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, [supabase]);

  const handleAction = async (action: 'accept' | 'reject' | 'remove', connectionId: string) => {
    try {
      setLoading(true);
      switch (action) {
        case 'accept':
          await onAccept(connectionId);
          // Update the connection status in local state
          setConnections(prev => prev.map(conn => 
            conn.id === connectionId 
              ? { ...conn, status: 'accepted' }
              : conn
          ));
          break;
        case 'reject':
          await onReject(connectionId);
          // Remove the connection from local state
          setConnections(prev => prev.filter(conn => conn.id !== connectionId));
          break;
        case 'remove':
          await onRemove(connectionId);
          // Remove the connection from local state
          setConnections(prev => prev.filter(conn => conn.id !== connectionId));
          break;
      }
      toast({
        title: 'Success',
        description: `Connection ${action}ed successfully`,
      });
    } catch (error) {
      console.error(`Error ${action}ing connection:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} connection`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(connection => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return connection.status === 'pending';
    if (activeTab === 'accepted') return connection.status === 'accepted';
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            <div className="space-y-4">
              {filteredConnections.map((connection) => {
                const otherUser = connection.requester.id === currentUserId
                  ? connection.receiver
                  : connection.requester;
                const isRequester = connection.requester.id === currentUserId;

                return (
                  <Card key={connection.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={otherUser.avatar_url || undefined} />
                            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{otherUser.name}</h3>
                            <p className="text-sm text-gray-500">{otherUser.role}</p>
                            {otherUser.department && (
                              <p className="text-sm text-gray-500">{otherUser.department}</p>
                            )}
                            {otherUser.current_company && (
                              <p className="text-sm text-gray-500">{otherUser.current_company}</p>
                            )}
                            {otherUser.current_position && (
                              <p className="text-sm text-gray-500">{otherUser.current_position}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {connection.status === 'pending' ? (
                            isRequester ? (
                              <Badge variant="secondary">Request Sent</Badge>
                            ) : (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAction('accept', connection.id)}
                                  disabled={loading}
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleAction('reject', connection.id)}
                                  disabled={loading}
                                >
                                  Reject
                                </Button>
                              </>
                            )
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAction('remove', connection.id)}
                              disabled={loading}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredConnections.length === 0 && (
                <p className="text-center text-gray-500">No connections found</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 