import { Suspense } from "react";
import { getServerSession, getServerUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
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

      {/* Announcements Hero Section */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-semibold text-muted-foreground">Latest Announcements</h2>
        </div>
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
          <AnnouncementsList limit={5} />
        </Suspense>
      </section>

      {/* Network & Connections Section */}
      <div className="grid gap-8">
        <NetworkSection userRole="student" />
      </div>
    </div>
  );
}