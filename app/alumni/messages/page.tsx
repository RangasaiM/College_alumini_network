import { ChatView } from "@/components/messages/chat-view";
import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";

export default async function AlumniMessagesPage() {
  const session = await getServerSession();
  const user = await getServerUserDetails();

  if (!session || !user) {
    redirect("/");
  }

  return (
    <div className="container h-[calc(100vh-80px)] py-6 flex flex-col">
      <ChatView currentUserId={user.id} />
    </div>
  );
}