import { redirect } from "next/navigation";
import { getSession, getUserDetails, getServerSupabase } from "@/lib/supabase/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/auth-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function StudentMessagesPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  const userDetails = await getUserDetails();
  
  if (!userDetails || userDetails.role !== "student") {
    redirect("/");
  }

  const supabase = getServerSupabase();
  
  // Get all conversations for the current user
  const { data: conversations, error } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      created_at,
      is_read,
      sender_id,
      receiver_id,
      sender:sender_id(id, name, avatar_url, role),
      receiver:receiver_id(id, name, avatar_url, role)
    `)
    .or(`sender_id.eq.${userDetails.id},receiver_id.eq.${userDetails.id}`)
    .order("created_at", { ascending: false })
    .limit(100);
  
  if (error) {
    console.error("Error fetching conversations:", error);
  }
  
  // Group messages by conversation partner
  const conversationMap = new Map();
  
  conversations?.forEach((message) => {
    const partnerId = message.sender_id === userDetails.id 
      ? message.receiver_id 
      : message.sender_id;
      
    const partner = message.sender_id === userDetails.id 
      ? message.receiver 
      : message.sender;
    
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partner,
        lastMessage: message,
        unreadCount: message.receiver_id === userDetails.id && !message.is_read ? 1 : 0,
      });
    } else {
      const existing = conversationMap.get(partnerId);
      if (message.created_at > existing.lastMessage.created_at) {
        existing.lastMessage = message;
      }
      if (message.receiver_id === userDetails.id && !message.is_read) {
        existing.unreadCount += 1;
      }
    }
  });
  
  const conversationList = Array.from(conversationMap.values());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Chat with alumni and students
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>
            Recent message conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversationList.length === 0 ? (
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
            <div className="space-y-4">
              {conversationList.map(({ partner, lastMessage, unreadCount }) => (
                <Link 
                  key={partner.id} 
                  href={`/student/messages/${partner.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={partner.avatar_url || ""} />
                        <AvatarFallback>
                          {partner.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{partner.name}</h3>
                          {unreadCount > 0 && (
                            <Badge className="ml-2" variant="secondary">
                              {unreadCount} new
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {lastMessage.sender_id === userDetails.id ? 'You: ' : ''}
                          {lastMessage.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 