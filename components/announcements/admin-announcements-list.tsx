'use client';

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import Image from "next/image";

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: string;
  created_at: string;
  user_id: string;
  user?: {
    name: string;
    avatar_url: string;
  };
  images?: string[] | null;
}

interface AdminAnnouncementsListProps {
  initialAnnouncements: Announcement[];
  onAnnouncementDeleted?: (id: string) => void;
}

export function AdminAnnouncementsList({
  initialAnnouncements,
  onAnnouncementDeleted
}: AdminAnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      if (onAnnouncementDeleted) {
        onAnnouncementDeleted(id);
      }
      toast.success('Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setDeletingId(null);
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No announcements yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="group flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all"
        >
          {announcement.images && announcement.images.length > 0 && (
            <div className="relative w-full sm:w-32 h-48 sm:h-24 shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={announcement.images[0]}
                alt={announcement.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                  {announcement.title}
                </h3>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive -mt-1 -mr-2 shrink-0"
                      disabled={deletingId === announcement.id}
                    >
                      {deletingId === announcement.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete "{announcement.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(announcement.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <p className="text-xs text-muted-foreground mb-1">
                {format(new Date(announcement.created_at), 'PPP')}
              </p>

              <p className="text-sm text-foreground/80 line-clamp-2">
                {announcement.content}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={announcement.target_role === 'all' ? 'default' : 'outline'} className="capitalize">
                {announcement.target_role === 'all' ? 'Everyone' : announcement.target_role}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 