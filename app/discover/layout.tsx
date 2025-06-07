import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const user = await getServerUserDetails();

  if (!session || !user) {
    redirect("/");
  }

  return <DashboardLayout role={user.role}>{children}</DashboardLayout>;
} 