export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { getSession, getUserDetails, getPendingUsers } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, User, Bell, PieChart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createServerSupabaseClient } from "@/lib/supabase/auth-helpers";

export default async function AdminDashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/signin");
  }
  
  const userDetails = await getUserDetails();
  
  if (!userDetails || userDetails.role !== "admin") {
    redirect("/");
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, announcements, and monitor activity
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Suspense fallback={<StatsLoadingSkeleton />}>
            <DashboardStats />
          </Suspense>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                New users waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<PendingUsersLoadingSkeleton />}>
                <PendingUsersList />
              </Suspense>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Link href="/admin/pending-approvals">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                    <UserPlus className="h-6 w-6" />
                    <span>Manage Approvals</span>
                  </Button>
                </Link>
                <Link href="/admin/announcements">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                    <Bell className="h-6 w-6" />
                    <span>Post Announcement</span>
                  </Button>
                </Link>
                <Link href="/admin/directory">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                    <User className="h-6 w-6" />
                    <span>User Directory</span>
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                    <PieChart className="h-6 w-6" />
                    <span>View Analytics</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatsLoadingSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function PendingUsersLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function DashboardStats() {
  const supabase = createServerSupabaseClient();
  
  // Get total users count
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });
    
  // Get students count
  const { count: studentCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "student")
    .eq("is_approved", true);
    
  // Get alumni count
  const { count: alumniCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "alumni")
    .eq("is_approved", true);
    
  // Get pending approvals count
  const { count: pendingCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_approved", false);
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            Approved accounts
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Students</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{studentCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Active student accounts
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alumni</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
            <path d="M5 21v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{alumniCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Active alumni accounts
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting approval
          </p>
        </CardContent>
      </Card>
    </>
  );
}

async function PendingUsersList() {
  const pendingUsers = await getPendingUsers();
  
  if (!pendingUsers || pendingUsers.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">
          No pending approvals at the moment.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {pendingUsers.slice(0, 3).map((user) => (
        <div key={user.id} className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">
                {user.role} • {user.email}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      {pendingUsers.length > 3 && (
        <div className="text-center pt-2">
          <Link href="/admin/pending-approvals">
            <Button variant="link">
              View all {pendingUsers.length} pending users
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}