'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectionWithUser } from './types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface ConnectionsListProps {
  connections: ConnectionWithUser[];
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function ConnectionsList({
  connections,
  onAccept,
  onReject,
  onRemove,
}: ConnectionsListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted'>('all');
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const filteredConnections = connections.filter(connection => {
    if (activeTab === 'pending') return connection.status === 'pending';
    if (activeTab === 'accepted') return connection.status === 'accepted';
    return true;
  });

  const handleAction = async (action: 'accept' | 'reject' | 'remove', connection: ConnectionWithUser) => {
    try {
      setLoading(connection.id);
      if (action === 'accept') await onAccept(connection.id);
      else if (action === 'reject') await onReject(connection.id);
      else await onRemove(connection.id);
      
      toast({
        title: 'Success',
        description: `Connection ${action}ed successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process your request',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline">Connected</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Network</CardTitle>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Connected</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredConnections.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No connections found
          </p>
        ) : (
          filteredConnections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={connection.requester.avatar_url || ''} />
                  <AvatarFallback>
                    {connection.requester.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{connection.requester.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {connection.requester.role === 'student'
                      ? `Student, Batch of ${connection.requester.batch_year}`
                      : `${connection.requester.current_role} at ${connection.requester.current_company}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(connection.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {connection.status === 'pending' && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAction('accept', connection)}
                      disabled={!!loading}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction('reject', connection)}
                      disabled={!!loading}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {connection.status === 'accepted' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('remove', connection)}
                    disabled={!!loading}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
} 