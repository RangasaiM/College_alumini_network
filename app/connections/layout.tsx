import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import DashboardLayoutServer from "@/components/layout/dashboard-layout-server";

export default async function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const user = await getServerUserDetails();

  if (!session || !user) {
    redirect("/");
  }

  return <DashboardLayoutServer role={user.role}>{children}</DashboardLayoutServer>;
} 