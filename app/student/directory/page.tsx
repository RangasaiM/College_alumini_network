import { Suspense } from "react";
import { getSession, getUserDetails } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDirectory } from "@/components/directory/user-directory";
import { DirectorySearch } from "@/components/directory/directory-search";

export default async function StudentDirectoryPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/signin");
  }
  
  const userDetails = await getUserDetails();
  
  if (!userDetails || userDetails.role !== "student") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alumni Directory</h1>
        <p className="text-muted-foreground">
          Connect with alumni for networking and mentorship
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Alumni</CardTitle>
        </CardHeader>
        <CardContent>
          <DirectorySearch filterRole="alumni" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Alumni Network</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DirectoryLoadingSkeleton />}>
            <UserDirectory filterRole="alumni" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function DirectoryLoadingSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div className="border-t p-4">
            <Skeleton className="h-9 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}