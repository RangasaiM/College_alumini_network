import { getServerSupabase } from "@/lib/supabase/auth-helpers";
import { AnnouncementsCarousel } from "@/components/announcements/announcements-carousel";

interface AnnouncementsListProps {
  limit?: number;
}

export async function AnnouncementsList({ limit = 10 }: AnnouncementsListProps) {
  const supabase = getServerSupabase();

  let query = supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: announcements } = await query;

  // Need to cast or validate the type of announcements to match expected props
  // Specifically ensuring images is string[] | null
  const formattedAnnouncements = announcements?.map(a => ({
    id: String(a.id),
    title: a.title,
    content: a.content,
    created_at: a.created_at,
    images: a.images as string[] | null
  })) || [];

  return (
    <div className="w-full">
      <AnnouncementsCarousel announcements={formattedAnnouncements} />
    </div>
  );
}