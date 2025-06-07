import { redirect } from "next/navigation";
import { getSession, getUserDetails, getServerSupabase } from "@/lib/supabase/auth-helpers";
import { ChatInterface } from "@/app/shared/messages/chat-interface";

export default async function AlumniMessagePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  const userDetails = await getUserDetails();
  
  if (!userDetails || userDetails.role !== "alumni") {
    redirect("/");
  }

  // Get recipient details
  const supabase = getServerSupabase();
  const { data: recipient } = await supabase
    .from("users")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!recipient) {
    redirect("/alumni/messages");
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Chat with {recipient.name}
        </p>
      </div>

      <div className="flex-1 rounded-lg border bg-card">
        <ChatInterface receiverId={recipient.id} receiverName={recipient.name} />
      </div>
    </div>
  );
} 