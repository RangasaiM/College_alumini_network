import { UserProfileView } from "@/app/shared/profile/user-profile-view";
import { getServerSession, getServerUserDetails, getServerSupabase } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";

export default async function StudentProfilePage() {
  const session = await getServerSession();
  const user = await getServerUserDetails();
  const supabase = getServerSupabase();

  if (!session || !user) {
    redirect("/");
  }

  const { count: connectionCount } = await supabase
    .from('connections')
    .select('id', { count: 'exact', head: true })
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted');

  return <UserProfileView user={user} currentUser={user} isOwnProfile={true} connectionCount={connectionCount || 0} />;
}