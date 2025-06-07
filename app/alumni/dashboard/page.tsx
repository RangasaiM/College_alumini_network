import { Suspense } from "react";
import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Users, MessageSquare } from "lucide-react";
import { AnnouncementsList } from "@/components/announcements/announcements-list";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkSection } from "@/app/shared/network/network-section";

export default async function AlumniDashboardPage() {
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

      <NetworkSection userRole="alumni" />

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

function MentorshipLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function MentorshipRequestsList({ userId }: { userId: string }) {
  // This would be implemented to fetch mentorship requests
  // For now, return an empty state
  return (
    <div className="text-center py-6">
      <p className="text-muted-foreground">
        No mentorship requests at the moment.
      </p>
    </div>
  );
}