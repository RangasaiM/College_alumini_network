import { Card } from "@/components/ui/card";
import { getServerSupabase } from "@/lib/supabase/auth-helpers";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AnnouncementsListProps {
  limit?: number;
}

export async function AnnouncementsList({ limit = 5 }: AnnouncementsListProps) {
  const supabase = getServerSupabase();
  
  let query = supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (limit) {
    query = query.limit(limit);
  }
    
  const { data: announcements } = await query;
  
  if (!announcements?.length) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No announcements yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id} className="p-4">
          <h3 className="font-semibold mb-2">{announcement.title}</h3>
          <p className="text-sm text-muted-foreground">{announcement.content}</p>
          <div className="text-xs text-muted-foreground mt-2">
            {new Date(announcement.created_at).toLocaleDateString()}
          </div>
        </Card>
      ))}
    </div>
  );
}