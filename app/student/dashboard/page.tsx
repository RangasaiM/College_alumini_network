import { Suspense } from "react";
import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Users, MessageSquare } from "lucide-react";
import { AnnouncementsList } from "@/components/announcements/announcements-list";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkSection } from "@/app/shared/network/network-section";

export default async function StudentDashboardPage() {
  const session = await getServerSession();
  const user = await getServerUserDetails();

  if (!session || !user) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name}!
        </p>
      </div>

      <NetworkSection userRole="student" />

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[200px]" />}>
              <AnnouncementsList limit={3} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}