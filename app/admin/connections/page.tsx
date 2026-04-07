import { ConnectionsView } from "@/components/connections/connections-view";
import { getServerSupabase, getSession } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";

export default async function AdminConnectionsPage() {
  const supabase = getServerSupabase();
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();

  if (!user || user.role !== 'admin') {
    redirect("/");
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
        <p className="text-muted-foreground">
          Network with students and alumni
        </p>
      </div>
      <ConnectionsView currentUserId={user.id} currentUserRole="admin" />
    </div>
  );
}