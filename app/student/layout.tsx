import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const user = await getServerUserDetails();

  console.log('StudentLayout: Checking auth state:', {
    hasSession: !!session,
    hasUser: !!user,
    userRole: user?.role
  });

  if (!session) {
    console.log('StudentLayout: No session found');
    // Instead of redirecting to signin, redirect to root to let middleware handle it
    redirect('/');
  }

  if (!user) {
    console.log('StudentLayout: No user profile found');
    redirect('/signup');
  }

  if (user.role !== "student") {
    console.log('StudentLayout: Invalid role access attempt');
    redirect(`/${user.role}/dashboard`);
  }

  if (!user.is_approved) {
    console.log('StudentLayout: User not approved');
    redirect('/pending-approval');
  }

  return <DashboardLayout role="student">{children}</DashboardLayout>;
} 