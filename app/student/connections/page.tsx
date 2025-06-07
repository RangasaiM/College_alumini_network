import { ConnectionsList } from '@/components/connections/connections-list';
import { redirect } from "next/navigation";
import { getSession, getUserDetails } from "@/lib/supabase/auth-helpers";

export default async function StudentConnectionsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  const userDetails = await getUserDetails();
  
  if (!userDetails || userDetails.role !== "student") {
    redirect("/");
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Connections</h1>
      <ConnectionsList />
    </div>
  );
} 