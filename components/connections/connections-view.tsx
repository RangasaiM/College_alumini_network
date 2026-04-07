"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, X, MessageSquare, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserListItem } from "@/components/shared/user-list-item";

interface UserProfile {
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
    department: string | null;
    current_position: string | null;
    current_company: string | null;
    bio: string | null;
}

interface Connection {
    id: string;
    requester_id: string;
    receiver_id: string;
    status: "pending" | "accepted" | "rejected";
    created_at: string;
    profile: UserProfile; // The 'other' person
}

interface ConnectionsViewProps {
    currentUserId: string;
    currentUserRole: string;
}

export function ConnectionsView({ currentUserId, currentUserRole }: ConnectionsViewProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "my-network");
    const [connections, setConnections] = useState<Connection[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const tab = searchParams?.get("tab");
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchData();
    }, [currentUserId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all connections involving current user
            const { data: connData, error: connError } = await supabase
                .from("connections")
                .select(`
          id,
          requester_id,
          receiver_id,
          status,
          created_at,
          requester:users!requester_id(id, name, role, avatar_url, department, current_position, current_company, bio),
          receiver:users!receiver_id(id, name, role, avatar_url, department, current_position, current_company, bio)
        `)
                .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

            if (connError) throw connError;

            const myConns: Connection[] = [];
            const pending: Connection[] = [];

            connData?.forEach((conn: any) => {
                const isRequester = conn.requester_id === currentUserId;
                const otherUser = isRequester ? conn.receiver : conn.requester;

                if (!otherUser) return; // Skip if user profile is missing

                const connectionObj = {
                    id: conn.id,
                    requester_id: conn.requester_id,
                    receiver_id: conn.receiver_id,
                    status: conn.status,
                    created_at: conn.created_at,
                    profile: otherUser
                };

                if (conn.status === "accepted") {
                    myConns.push(connectionObj);
                } else if (conn.status === "pending" && !isRequester) {
                    // Only show pending where I am the receiver
                    pending.push(connectionObj);
                }
                // If I am requester and status is pending, I see it as "Sent" (could add a tab for that, but maybe later)
                // For now, I just know I can't request again.
            });

            setConnections(myConns);
            setPendingRequests(pending);

        } catch (error) {
            console.error("Error fetching connections:", error);
            toast.error("Failed to load network data");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (connectionId: string) => {
        try {
            const { error } = await supabase
                .from("connections")
                .update({ status: "accepted" })
                .eq("id", connectionId);

            if (error) throw error;

            toast.success("Request accepted");
            // Move from pending to connections
            const req = pendingRequests.find(r => r.id === connectionId);
            if (req) {
                setPendingRequests(prev => prev.filter(r => r.id !== connectionId));
                setConnections(prev => [...prev, { ...req, status: "accepted" }]);
            }
        } catch (error) {
            toast.error("Failed to accept request");
        }
    };

    const handleReject = async (connectionId: string) => {
        try {
            const { error } = await supabase
                .from("connections")
                .update({ status: "rejected" }) // or delete? usually reject to stop re-request
                .eq("id", connectionId);

            if (error) throw error;

            toast.success("Request rejected");
            setPendingRequests(prev => prev.filter(r => r.id !== connectionId));
        } catch (error) {
            toast.error("Failed to reject request");
        }
    };

    const handleMessage = (userId: string) => {
        // Navigate to messages
        // We assume the route structure is /{role}/messages?chatWith={userId}
        router.push(`/${currentUserRole}/messages?chatWith=${userId}`);
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading network...</div>;
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="my-network" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="my-network">My Network ({connections.length})</TabsTrigger>
                    <TabsTrigger value="pending">Requests ({pendingRequests.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="my-network" className="mt-6">
                    {connections.length === 0 ? (
                        <div className="text-center py-12 border rounded-xl bg-card text-muted-foreground">
                            You don't have any connections yet.
                        </div>
                    ) : (
                        <div className="bg-card border rounded-xl divide-y">
                            {connections.map(conn => (
                                <UserListItem
                                    key={conn.id}
                                    user={conn.profile}
                                    action={
                                        <Button variant="ghost" size="icon" onClick={() => handleMessage(conn.profile.id)}>
                                            <MessageSquare className="h-5 w-5 text-primary" />
                                        </Button>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-12 border rounded-xl bg-card text-muted-foreground">
                            No pending connection requests.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingRequests.map(conn => (
                                <UserCard
                                    key={conn.id}
                                    user={conn.profile}
                                    action={
                                        <div className="flex gap-2 w-full">
                                            <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleAccept(conn.id)}>
                                                <Check className="h-4 w-4" /> Accept
                                            </Button>
                                            <Button variant="outline" className="flex-1 gap-2 text-red-600 hover:bg-red-50" size="sm" onClick={() => handleReject(conn.id)}>
                                                <X className="h-4 w-4" /> Reject
                                            </Button>
                                        </div>
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

function UserCard({ user, action }: { user: UserProfile, action: React.ReactNode }) {
    return (
        <div className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
            <div className="h-20 bg-muted/50 w-full relative">
                <div className="absolute -bottom-10 left-4 rounded-full p-1 bg-card">
                    <Link href={`/profile/${user.id}`}>
                        <Avatar className="h-20 w-20 border shadow-sm">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xl">
                                {user.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </div>

            <div className="pt-12 px-4 pb-4 flex-1 flex flex-col">
                <div className="mb-3">
                    <Link href={`/profile/${user.id}`} className="hover:underline decoration-primary/50 underline-offset-4">
                        <h3 className="font-bold text-lg leading-tight truncate" title={user.name}>
                            {user.name}
                        </h3>
                    </Link>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5 capitalize">{user.role}</p>
                </div>

                <div className="space-y-1.5 mb-4 flex-1">
                    <div className="text-sm text-foreground/80 flex items-center gap-2">
                        <span className="truncate">{user.role === 'student' ? (user.bio || user.department || 'Bio N/A') : (user.department || 'Department N/A')}</span>
                    </div>

                    {(user.current_company || user.current_position) ? (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                            {user.current_position} {user.current_position && user.current_company && 'at'} {user.current_company}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground opacity-50 italic">
                            No position listed
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-3 border-t border-border/50">
                    {action}
                </div>
            </div>
        </div>
    );
}
