'use client';

import { UserCard } from "@/app/shared/users/user-card";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      setCurrentUserId(session.user.id);

      // Fetch accepted connections
      const { data: acceptedConnections, error: acceptedError } = await supabase
        .from('connections')
        .select(`
          *,
          requester:users!requester_id(
            id, name, role, department, company, avatar_url
          ),
          receiver:users!receiver_id(
            id, name, role, department, company, avatar_url
          )
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

      if (acceptedError) throw acceptedError;

      // Fetch pending received requests
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('connections')
        .select(`
          *,
          requester:users!requester_id(
            id, name, role, department, company, avatar_url
          )
        `)
        .eq('receiver_id', session.user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      // Fetch pending sent requests
      const { data: outgoingRequests, error: sentError } = await supabase
        .from('connections')
        .select(`
          *,
          receiver:users!receiver_id(
            id, name, role, department, company, avatar_url
          )
        `)
        .eq('requester_id', session.user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      setConnections(acceptedConnections || []);
      setPendingRequests(receivedRequests || []);
      setSentRequests(outgoingRequests || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Set up real-time subscription for connections
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `or(requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId})`
        },
        (payload) => {
          console.log('Connection change detected:', payload);
          fetchConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchConnections, supabase]);

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;
      await fetchConnections();
      toast.success('Connection accepted');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'rejected' })
        .eq('id', connectionId);

      if (error) throw error;
      await fetchConnections();
      toast.success('Connection rejected');
    } catch (error) {
      console.error('Error rejecting connection:', error);
      toast.error('Failed to reject connection');
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      await fetchConnections();
      toast.success('Connection removed');
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to remove connection');
    }
  };

  const filterConnections = (items: any[], query: string) => {
    const searchLower = query.toLowerCase();
    return items.filter((item) => {
      const user = item.requester_id === currentUserId ? item.receiver : item.requester;
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        user.department?.toLowerCase().includes(searchLower) ||
        user.company?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower)
      );
    });
  };

  const filteredConnections = filterConnections(connections, searchQuery);
  const filteredPendingRequests = filterConnections(pendingRequests, searchQuery);
  const filteredSentRequests = filterConnections(sentRequests, searchQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Connections</h1>
        <p className="text-muted-foreground">
          Manage your network connections and requests.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Search</Label>
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">
            Connections ({filteredConnections.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Requests ({filteredPendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent Requests ({filteredSentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          {loading ? (
            <p>Loading...</p>
          ) : filteredConnections.length === 0 ? (
            <p className="text-muted-foreground">No connections found.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredConnections.map((connection) => {
                const user =
                  connection.requester_id === currentUserId
                    ? connection.receiver
                    : connection.requester;
                return (
                  <UserCard 
                    key={connection.id} 
                    user={user}
                    actions={
                      <button
                        onClick={() => handleRemoveConnection(connection.id)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Remove Connection
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {loading ? (
            <p>Loading...</p>
          ) : filteredPendingRequests.length === 0 ? (
            <p className="text-muted-foreground">No pending requests.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPendingRequests.map((request) => (
                <UserCard 
                  key={request.id} 
                  user={request.requester}
                  actions={
                    <div className="space-x-2">
                      <button
                        onClick={() => handleAcceptConnection(request.id)}
                        className="text-sm text-green-500 hover:text-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectConnection(request.id)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {loading ? (
            <p>Loading...</p>
          ) : filteredSentRequests.length === 0 ? (
            <p className="text-muted-foreground">No sent requests.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSentRequests.map((request) => (
                <UserCard 
                  key={request.id} 
                  user={request.receiver}
                  actions={
                    <button
                      onClick={() => handleRemoveConnection(request.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Cancel Request
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 