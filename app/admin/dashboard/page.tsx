export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from "react";
import { getSession, getUserDetails, getPendingUsers } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Bell, Users, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementsList } from "@/components/announcements/announcements-list";

function PendingUsersLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

async function PendingUsersList() {
  const pendingUsers = await getPendingUsers();

  if (!pendingUsers || pendingUsers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
        <CardDescription>
          Review and approve new user registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.role === 'student' ? `${user.department} • Batch of ${user.graduation_year}` :
                      `${user.current_position || 'Alumni'} at ${user.current_company || '-'}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registered on {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Link href="/admin/pending-approvals" className="shrink-0">
                <Button variant="outline" size="sm">
                  Review
                </Button>
              </Link>
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
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const userDetails = await getUserDetails();

  if (!userDetails || userDetails.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {userDetails.name}!
        </p>
      </div>

      <div className="space-y-8">
        {/* Announcements Hero Section */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-semibold text-muted-foreground">Latest Announcements</h2>
            <Link href="/admin/announcements">
              <Button size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Announcement
              </Button>
            </Link>
          </div>
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
            <AnnouncementsList limit={5} />
          </Suspense>
        </section>

        {/* Pending Approvals Section */}
        <section>
          <Suspense fallback={<PendingUsersLoadingSkeleton />}>
            <PendingUsersList />
          </Suspense>
        </section>
      </div>
    </div>
  );
}