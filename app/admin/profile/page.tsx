import { getServerSupabase, getSession } from "@/lib/supabase/auth-helpers";
import { CompletionStatus } from "@/app/shared/profile/completion-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminProfilePage() {
  const supabase = getServerSupabase();
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Link href="/admin/profile/edit">
          <Button>Edit Profile</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completion Status */}
        <div className="md:col-span-1">
          <CompletionStatus 
            userRole={userData.role} 
            profileData={userData} 
          />
        </div>

        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{userData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{userData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{userData.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{userData.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{userData.position}</p>
                </div>
              </div>

              {(userData.linkedin_url || userData.github_url) && (
                <div className="space-y-2 pt-2">
                  <p className="font-medium">Professional Links</p>
                  {userData.linkedin_url && (
                    <a href={userData.linkedin_url} target="_blank" rel="noopener noreferrer"
                       className="block text-primary hover:underline">LinkedIn Profile</a>
                  )}
                  {userData.github_url && (
                    <a href={userData.github_url} target="_blank" rel="noopener noreferrer"
                       className="block text-primary hover:underline">GitHub Profile</a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bio</CardTitle>
            </CardHeader>
            <CardContent>
              {userData.bio && (
                <p>{userData.bio}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 