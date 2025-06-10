'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Building2, GraduationCap, Users2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  current_company: string | null;
  current_position: string | null;
  avatar_url: string | null;
  batch_year?: number;
  graduation_year?: number;
}

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  requester: User;
  receiver: User;
}

interface ConnectionsListProps {
  connections: Connection[];
  onAccept: (connectionId: string) => Promise<void>;
  onReject: (connectionId: string) => Promise<void>;
  onRemove: (connectionId: string) => Promise<void>;
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
          setConnections(prev => prev.map(conn => 
            conn.id === connectionId 
              ? { ...conn, status: 'accepted' }
              : conn
          ));
          break;
        case 'reject':
          await onReject(connectionId);
          setConnections(prev => prev.filter(conn => conn.id !== connectionId));
          break;
        case 'remove':
          await onRemove(connectionId);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Users2 className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">My Network</CardTitle>
          </div>
          <p className="text-muted-foreground">
            {filteredConnections.length} {activeTab === 'all' ? 'total' : activeTab} connection{filteredConnections.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full max-w-4xl mx-auto"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all">All Connections</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Connected</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <div className="grid gap-4 sm:gap-6">
                {filteredConnections.map((connection, index) => {
                  const otherUser = connection.requester.id === currentUserId
                    ? connection.receiver
                    : connection.requester;
                  const isRequester = connection.requester.id === currentUserId;

                  return (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <Link 
                              href={`/profile/${otherUser.id}`}
                              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full"
                            >
                              <Avatar className="h-16 w-16 sm:h-14 sm:w-14 ring-2 ring-background">
                                {otherUser.avatar_url ? (
                                  <AvatarImage src={otherUser.avatar_url} alt={otherUser.name} />
                                ) : (
                                  <AvatarFallback className="text-lg">
                                    {otherUser.name?.charAt(0)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-semibold truncate">
                                    {otherUser.name}
                                  </h3>
                                  <Badge variant="outline" className="capitalize">
                                    {otherUser.role}
                                  </Badge>
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground space-y-1">
                                  {otherUser.role === 'student' ? (
                                    <div className="flex items-center gap-1">
                                      <GraduationCap className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">Batch of {otherUser.batch_year}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Building2 className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">
                                        {otherUser.current_position} 
                                        {otherUser.current_company && ` at ${otherUser.current_company}`}
                                      </span>
                                    </div>
                                  )}
                                  <p className="truncate">{otherUser.department}</p>
                                </div>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto">
                              {connection.status === 'pending' ? (
                                isRequester ? (
                                  <Badge variant="secondary" className="w-full sm:w-auto justify-center">
                                    Request Sent
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleAction('accept', connection.id)}
                                      disabled={loading}
                                      className="flex-1"
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAction('reject', connection.id)}
                                      disabled={loading}
                                      className="flex-1"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                )
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAction('remove', connection.id)}
                                  disabled={loading}
                                  className="w-full sm:w-auto"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                {filteredConnections.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="py-8">
                      <CardContent className="text-center space-y-4">
                        <Users2 className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-lg font-medium">No connections found</p>
                          <p className="text-sm text-muted-foreground">
                            {activeTab === 'pending' 
                              ? 'You have no pending connection requests.'
                              : activeTab === 'accepted'
                                ? 'You haven\'t connected with anyone yet.'
                                : 'Start building your network by connecting with others.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 