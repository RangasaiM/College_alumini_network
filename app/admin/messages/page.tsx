import { ChatView } from "@/components/messages/chat-view";
import { getServerSupabase, getSession } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";

export default async function AdminMessagesPage() {
  const supabase = getServerSupabase();
  const session = await getSession();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();

  if (!user || user.role !== 'admin') {
    redirect("/");
  }

  return (
    <div className="container h-[calc(100vh-80px)] py-6 flex flex-col">
      <ChatView currentUserId={user.id} />
    </div>
  );
}