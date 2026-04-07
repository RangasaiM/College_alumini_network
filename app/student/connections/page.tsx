import { ConnectionsView } from "@/components/connections/connections-view";
import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";

export default async function StudentConnectionsPage() {
  const session = await getServerSession();
  const user = await getServerUserDetails();

  if (!session || !user) {
    redirect("/");
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
        <p className="text-muted-foreground">
          Expand your professional network
        </p>
      </div>
      <ConnectionsView currentUserId={user.id} currentUserRole="student" />
    </div>
  );
}