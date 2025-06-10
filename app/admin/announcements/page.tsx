'use client';

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnnouncementForm } from "./announcement-form";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAnnouncementsList } from "@/components/announcements/admin-announcements-list";
import { createBrowserClient } from '@supabase/ssr';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkSession();
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/signin");
      return;
    }

    // Check if user is admin
    const { data: userDetails } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!userDetails || userDetails.role !== 'admin') {
      router.push("/");
      return;
    }
  };

  const handleAnnouncementCreated = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const handleAnnouncementDeleted = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">
          Create and manage announcements for all users
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
            <CardDescription>
              Post a new announcement for students and alumni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnnouncementForm onAnnouncementCreated={handleAnnouncementCreated} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>
              View and manage your announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <AnnouncementsLoadingSkeleton />
            ) : (
              <AdminAnnouncementsList 
                initialAnnouncements={announcements}
                onAnnouncementDeleted={handleAnnouncementDeleted}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnnouncementsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}