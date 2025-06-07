import { getServerSupabase } from "@/lib/supabase/auth-helpers";
import { CompletionStatus } from "@/app/shared/profile/completion-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AlumniProfilePage() {
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

  if (!userData || userData.role !== "alumni") {
    redirect("/");
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Link href="/alumni/profile/edit">
          <Button>Edit Profile</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completion Status */}
        <div className="md:col-span-1">
          <CompletionStatus role="alumni" profileData={userData} />
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
                  <p className="text-sm text-muted-foreground">Graduation Year</p>
                  <p className="font-medium">{userData.graduation_year}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Company</p>
                  <p className="font-medium">{userData.current_company || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Position</p>
                  <p className="font-medium">{userData.current_position || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Years of Experience</p>
                  <p className="font-medium">{userData.years_of_experience ? `${userData.years_of_experience} years` : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{userData.location || 'Not specified'}</p>
                </div>
              </div>

              {(userData.linkedin_url || userData.github_url || userData.website_url) && (
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
                  {userData.website_url && (
                    <a href={userData.website_url} target="_blank" rel="noopener noreferrer"
                       className="block text-primary hover:underline">Personal Website</a>
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
              {userData.bio ? (
                <p>{userData.bio}</p>
              ) : (
                <p className="text-muted-foreground">No bio added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {userData.skills && userData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userData.skills.map((skill: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No skills added yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 