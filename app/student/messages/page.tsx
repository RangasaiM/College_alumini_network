import { getServerSession } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function StudentMessagesPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/auth/signin");
  }

  const supabase = createServerComponentClient({ cookies });

  // Get all conversations
  const { data: conversations, error } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      created_at,
      read,
      sender_id,
      receiver_id,
      sender:users!messages_sender_id_fkey(id, name, avatar_url, role),
      receiver:users!messages_receiver_id_fkey(id, name, avatar_url, role)
    `)
    .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return <div>Error loading conversations</div>;
  }

  // Group messages by conversation partner
  const conversationMap = new Map();
  conversations.forEach((message) => {
    const partnerId = message.sender_id === session.user.id
      ? message.receiver_id
      : message.sender_id;
    const partner = message.sender_id === session.user.id
      ? message.receiver
      : message.sender;

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partner,
        lastMessage: message,
        unreadCount: 0,
      });
    }

    // Update unread count
    if (message.receiver_id === session.user.id && !message.read) {
      const conversation = conversationMap.get(partnerId);
      conversation.unreadCount++;
      conversationMap.set(partnerId, conversation);
    }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Messages</h2>
      <div className="grid gap-4">
        {Array.from(conversationMap.values()).length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-muted-foreground"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium mb-1">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start a new conversation by visiting the directory
            </p>
            <Link
              href="/student/directory"
              className="text-primary hover:underline"
            >
              Browse Directory
            </Link>
          </div>
        ) : (
          Array.from(conversationMap.values()).map((conversation) => (
            <Link
              key={conversation.partner.id}
              href={`/student/messages/${conversation.partner.id}`}
            >
              <Card className="hover:bg-accent transition-colors">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage src={conversation.partner.avatar_url} />
                    <AvatarFallback>
                      {conversation.partner.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{conversation.partner.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {conversation.unreadCount}
                    </div>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 