import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { getSession, getUserDetails } from "@/lib/supabase/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/auth-helpers";
import { ChatInterface } from "@/components/messages/chat-interface";

export default async function MessagePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  
  if (!session) {
    redirect("/signin");
  }
  
  const userDetails = await getUserDetails();
  
  if (!userDetails) {
    redirect("/");
  }

  // Get recipient details
  const supabase = createServerSupabaseClient();
  const { data: recipient } = await supabase
    .from("users")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!recipient) {
    redirect("/messages");
  }

  return (
    <DashboardLayout role={userDetails.role as any}>
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Chat with {recipient.name}
          </p>
        </div>

        <div className="flex-1 rounded-lg border bg-card">
          <ChatInterface 
            currentUser={userDetails} 
            recipient={recipient} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}