"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
}

interface ChatContact {
    id: string;
    name: string;
    avatar_url: string | null;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

interface ChatViewProps {
    currentUserId: string;
}

export function ChatView({ currentUserId }: ChatViewProps) {
    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const initialChatWith = searchParams.get("chatWith");

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Fetch Contacts (Connections)
    useEffect(() => {
        fetchContacts();
    }, [currentUserId]);

    // 2. Set active contact from URL if present
    useEffect(() => {
        if (initialChatWith && contacts.length > 0) {
            if (contacts.some(c => c.id === initialChatWith)) {
                setActiveContactId(initialChatWith);
            } else {
                // Fetch specific user if not in connections list yet (edge case)
                fetchSingleContact(initialChatWith);
            }
        } else if (!activeContactId && contacts.length > 0 && !initialChatWith) {
            // Optional: Select first contact by default
            // setActiveContactId(contacts[0].id);
        }
    }, [initialChatWith, contacts]);

    // 3. Fetch Messages when active contact changes & Subscribe to Realtime
    useEffect(() => {
        if (!activeContactId) return;

        fetchMessages(activeContactId);

        // Realtime Subscription
        const channel = supabase
            .channel(`chat:${currentUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // If message is from active contact, add to list
                    if (newMsg.sender_id === activeContactId) {
                        setMessages(prev => [...prev, newMsg]);
                        markAsRead(newMsg.id);
                        scrollToBottom();
                    } else {
                        // Update contact list unread count/last message (simplified for now)
                        toast.info("New message received");
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeContactId, currentUserId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const fetchSingleContact = async (userId: string) => {
        const { data } = await supabase.from("users").select("id, name, avatar_url").eq("id", userId).single();
        if (data) {
            setContacts(prev => {
                if (prev.find(c => c.id === userId)) return prev;
                return [data, ...prev];
            });
            setActiveContactId(userId);
        }
    };

    const fetchContacts = async () => {
        try {
            // Fetch connections
            const { data: connData } = await supabase
                .from("connections")
                .select(`
          requester:users!requester_id(id, name, avatar_url),
          receiver:users!receiver_id(id, name, avatar_url)
        `)
                .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .eq("status", "accepted");

            const mappedContacts: ChatContact[] = [];
            const seenIds = new Set<string>();

            connData?.forEach((conn: any) => {
                const other = conn.requester.id === currentUserId ? conn.receiver : conn.requester;
                if (!seenIds.has(other.id)) {
                    mappedContacts.push({
                        id: other.id,
                        name: other.name,
                        avatar_url: other.avatar_url
                    });
                    seenIds.add(other.id);
                }
            });

            setContacts(mappedContacts);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (otherUserId: string) => {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
            .order("created_at", { ascending: true });

        setMessages(data || []);
        scrollToBottom();
    };

    const markAsRead = async (messageId: string) => {
        await supabase.from("messages").update({ is_read: true }).eq("id", messageId);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !activeContactId) return;

        const msgContent = newMessage;
        setNewMessage("");

        // Optimistic UI update
        const optimisticMsg: Message = {
            id: "temp-" + Date.now(),
            sender_id: currentUserId,
            receiver_id: activeContactId,
            content: msgContent,
            created_at: new Date().toISOString(),
            is_read: false
        };
        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();

        const { data, error } = await supabase
            .from("messages")
            .insert({
                sender_id: currentUserId,
                receiver_id: activeContactId,
                content: msgContent
            })
            .select()
            .single();

        if (error) {
            toast.error("Failed to send message");
            // Rollback? For MVP we assume success
        } else if (data) {
            // Replace temp ID with real ID
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data : m));
        }
    };

    const activeContact = contacts.find(c => c.id === activeContactId);

    return (
        <div className="flex h-[calc(100vh-120px)] border rounded-lg overflow-hidden bg-background shadow-sm">
            {/* Sidebar - Contacts */}
            <div className={cn(
                "w-full md:w-80 border-r bg-muted/20 flex flex-col",
                activeContactId ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b font-semibold">Messages</div>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-1 p-2">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">Loading connections...</div>
                        ) : contacts.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">No connections yet. Connect with people to chat!</div>
                        ) : (
                            contacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => setActiveContactId(contact.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left",
                                        activeContactId === contact.id && "bg-muted"
                                    )}
                                >
                                    <Avatar>
                                        <AvatarImage src={contact.avatar_url || ""} />
                                        <AvatarFallback>{contact.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-medium truncate">{contact.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            Connect to chat
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-background",
                !activeContactId ? "hidden md:flex" : "flex"
            )}>
                {activeContactId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveContactId(null)}>
                                    {/* Back button for mobile */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                                </Button>
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={activeContact?.avatar_url || ""} />
                                    <AvatarFallback>{activeContact?.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{activeContact?.name}</div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex w-max max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2 text-sm",
                                                isMe
                                                    ? "ml-auto bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            {msg.content}
                                            <span className={cn("text-[10px] self-end opacity-70", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                                                {format(new Date(msg.created_at), "HH:mm")}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}
