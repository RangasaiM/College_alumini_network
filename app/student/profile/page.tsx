import { getServerSupabase } from "@/lib/supabase/auth-helpers";
import { CompletionStatus } from "@/app/shared/profile/completion-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StudentProfilePage() {
  const supabase = getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!userData || userData.role !== "student") {
    redirect("/");
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Link href="/student/profile/edit">
          <Button>Edit Profile</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completion Status */}
        <div className="md:col-span-1">
          <CompletionStatus role="student" profileData={userData} />
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
                <div>
                  <p className="text-sm text-muted-foreground">Batch Year</p>
                  <p className="font-medium">{userData.batch_year}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coding Profiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.github_url && (
                <div>
                  <p className="text-sm text-muted-foreground">GitHub</p>
                  <a href={userData.github_url} target="_blank" rel="noopener noreferrer" 
                     className="text-primary hover:underline">{userData.github_url}</a>
                </div>
              )}
              {userData.linkedin_url && (
                <div>
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <a href={userData.linkedin_url} target="_blank" rel="noopener noreferrer"
                     className="text-primary hover:underline">{userData.linkedin_url}</a>
                </div>
              )}
              {userData.leetcode_url && (
                <div>
                  <p className="text-sm text-muted-foreground">LeetCode</p>
                  <a href={userData.leetcode_url} target="_blank" rel="noopener noreferrer"
                     className="text-primary hover:underline">{userData.leetcode_url}</a>
                </div>
              )}
              {userData.codechef_url && (
                <div>
                  <p className="text-sm text-muted-foreground">CodeChef</p>
                  <a href={userData.codechef_url} target="_blank" rel="noopener noreferrer"
                     className="text-primary hover:underline">{userData.codechef_url}</a>
                </div>
              )}
              {userData.codeforces_url && (
                <div>
                  <p className="text-sm text-muted-foreground">Codeforces</p>
                  <a href={userData.codeforces_url} target="_blank" rel="noopener noreferrer"
                     className="text-primary hover:underline">{userData.codeforces_url}</a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills & Bio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.skills && userData.skills.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Skills</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {userData.skills.map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-secondary rounded-md text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {userData.bio && (
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="mt-1">{userData.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 