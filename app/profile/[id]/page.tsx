import { UserProfileView } from "@/app/shared/profile/user-profile-view";
import { getServerSupabase, getSession } from "@/lib/supabase/auth-helpers";
import { notFound, redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Fetch the user data for the profile being viewed
  console.log('Fetching profile for ID:', params.id);
  const { data: profileUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    console.error('Error fetching profile user:', error);
  }

  if (error || !profileUser) {
    console.error('Profile user not found', error, params.id);
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold text-destructive">User Not Found</h1>
        <p className="text-muted-foreground mt-2">
          Could not find user with ID: <code className="bg-muted px-1 py-0.5 rounded">{params.id}</code>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Error details: {error?.message || 'No user data returned'}
        </p>
      </div>
    );
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const { count: connectionCount } = await supabase
    .from('connections')
    .select('id', { count: 'exact', head: true })
    .or(`requester_id.eq.${profileUser.id},receiver_id.eq.${profileUser.id}`)
    .eq('status', 'accepted');

  const isOwnProfile = session.user.id === params.id;

  return (
    <DashboardLayout role={currentUser.role}>
      <div className="container py-6">
        <UserProfileView user={profileUser} currentUser={currentUser} isOwnProfile={isOwnProfile} connectionCount={connectionCount || 0} />
      </div>
    </DashboardLayout>
  );
}