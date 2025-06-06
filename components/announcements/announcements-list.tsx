import { createServerSupabaseClient } from "@/lib/supabase/auth-helpers";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AnnouncementsListProps {
  limit?: number;
}

export async function AnnouncementsList({ limit = 5 }: AnnouncementsListProps) {
  const supabase = createServerSupabaseClient();
  
  let query = supabase
    .from("announcements")
    .select(`
      *,
      users:admin_id (
        name
      )
    `)
    .order("created_at", { ascending: false });
    
  if (limit) {
    query = query.limit(limit);
  }
    
  const { data: announcements, error } = await query;
  
  if (error) {
    console.error("Error fetching announcements:", error);
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">
          Failed to load announcements.
        </p>
      </div>
    );
  }
  
  if (!announcements || announcements.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">
          No announcements yet.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{announcement.title}</h3>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
            </p>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {announcement.content}
          </p>
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Posted by {announcement.users?.name || "Admin"}
            </p>
            <Button variant="link" size="sm" className="p-0 h-auto" asChild>
              <Link href={`/announcements/${announcement.id}`}>
                Read more
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}