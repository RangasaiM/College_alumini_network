import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function AlumniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const user = await getServerUserDetails();

  if (!session) {
    redirect("/auth/signin");
  }

  if (!user || user.role !== "alumni") {
    redirect("/");
  }

  return <DashboardLayout role="alumni">{children}</DashboardLayout>;
} 