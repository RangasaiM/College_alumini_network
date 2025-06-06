export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { getSession, getUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnnouncementForm } from "./announcement-form";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementsList } from "@/components/announcements/announcements-list";

export default async function AnnouncementsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Create and manage announcements for all users
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Announcement</CardTitle>
              <CardDescription>
                Post a new announcement for students and alumni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnnouncementForm userId={userDetails.id} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>
                View and manage your announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<AnnouncementsLoadingSkeleton />}>
                <AnnouncementsList limit={5} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AnnouncementsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}