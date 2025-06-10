import { getServerSupabase } from "@/lib/supabase/auth-helpers";
import { CompletionStatus } from "@/app/shared/profile/completion-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        {/* Profile Card and Completion Status */}
        <div className="md:col-span-1">
          <Card className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                {userData.avatar_url ? (
                  <AvatarImage src={userData.avatar_url} alt={userData.name} />
                ) : (
                  <AvatarFallback>{userData.name?.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">{userData.name}</h2>
                <p className="text-sm text-muted-foreground">{userData.email}</p>
              </div>
            </div>
          </Card>
          <div className="mt-6">
            <CompletionStatus role="alumni" profileData={userData} />
          </div>
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
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{userData.department || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Graduation Year</p>
                  <p className="font-medium">{userData.graduation_year || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{userData.location || 'Not specified'}</p>
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
              </div>

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
              
              <div>
                <p className="text-sm text-muted-foreground">Bio</p>
                {userData.bio ? (
                  <p className="mt-1">{userData.bio}</p>
                ) : (
                  <p className="mt-1 text-muted-foreground italic">No bio added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 