'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, Check, UserCheck, MessageSquare, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import Link from 'next/link';

interface ConnectionActionsProps {
    userId: string;
    initialStatus?: 'sent' | 'received' | 'pending' | 'accepted' | null;
    className?: string;
}

export function ConnectionActions({ userId, initialStatus = null, className }: ConnectionActionsProps) {
    const [status, setStatus] = useState<'sent' | 'received' | 'pending' | 'accepted' | null>(initialStatus);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(!initialStatus);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (initialStatus) return;

        const checkStatus = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const currentUserId = session.user.id;
                if (currentUserId === userId) return; // Own profile

                const { data, error } = await supabase
                    .from('connections')
                    .select('*')
                    .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${currentUserId})`)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    console.error("Error fetching connection status:", error);
                }

                if (data) {
                    if (data.status === 'pending') {
                        setStatus(data.requester_id === currentUserId ? 'sent' : 'received');
                    } else {
                        setStatus(data.status);
                    }
                } else {
                    setStatus(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setChecking(false);
            }
        };

        checkStatus();
    }, [userId, initialStatus, supabase]);

    const handleConnect = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Please sign in to connect');
                return;
            }

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
            setStatus('sent');
        } catch (error) {
            console.error('Error sending connection request:', error);
            toast.error('Failed to send connection request');
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Navigation is handled by Link wrapper usually, but if this is a button:
        // window.location.href = `/messages?chatWith=${userId}`;
        // For now we keep the button variant rendering
    };

    if (checking) {
        return <div className="h-9 w-24 bg-muted/20 animate-pulse rounded-md" />;
    }

    if (status === 'accepted') {
        return (
            <Button variant="outline" size="sm" asChild className={className} onClick={(e) => e.stopPropagation()}>
                <Link href={`/messages?chatWith=${userId}`}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Message
                </Link>
            </Button>
        );
    }

    if (status === 'sent') {
        return (
            <Button variant="secondary" size="sm" disabled className={className}>
                <Check className="h-4 w-4 mr-2" /> Pending
            </Button>
        );
    }

    if (status === 'received') {
        return (
            <Button variant="secondary" size="sm" disabled className={className}>
                Request Received
            </Button>
        );
    }

    return (
        <Button
            variant="default"
            size="sm"
            className={className}
            onClick={handleConnect}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <UserPlus className="h-4 w-4 mr-2" />
            )}
            Connect
        </Button>
    );
}
