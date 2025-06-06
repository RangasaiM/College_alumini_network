export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { getSession, getUserDetails, getPendingUsers } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApprovalActions } from "./approval-actions";

export default async function PendingApprovalsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Manage user account approval requests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Approval Requests</CardTitle>
            <CardDescription>
              Review and approve new user registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<PendingUsersLoadingSkeleton />}>
              <PendingUsersList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function PendingUsersLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="space-y-2 md:space-y-0 md:flex md:space-x-2">
            <Skeleton className="h-10 w-full md:w-24" />
            <Skeleton className="h-10 w-full md:w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function PendingUsersList() {
  const pendingUsers = await getPendingUsers();
  
  if (!pendingUsers || pendingUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-muted-foreground"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium mb-1">No pending approvals</h3>
        <p className="text-muted-foreground">
          All user registration requests have been processed.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {pendingUsers.map((user) => (
        <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6">
          <div className="space-y-1 mb-4 md:mb-0">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm pl-16">
              <div>
                <span className="text-muted-foreground">Role:</span>{" "}
                <span className="capitalize">{user.role}</span>
              </div>
              {user.role === "student" ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Batch:</span>{" "}
                    <span>{user.batch_year}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>{" "}
                    <span>{user.department}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-muted-foreground">Graduation:</span>{" "}
                    <span>{user.graduation_year}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Job:</span>{" "}
                    <span>{user.current_job}</span>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <span className="text-muted-foreground">Registered:</span>{" "}
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <ApprovalActions userId={user.id} />
        </div>
      ))}
    </div>
  );
}