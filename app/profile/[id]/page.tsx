'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConnectButton } from "@/app/shared/users/connect-button";
import { ProfileTabs } from "@/app/shared/profile/profile-tabs";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'alumni' | 'admin';
  department?: string;
  batch_year?: number;
  graduation_year?: number;
  current_company?: string;
  current_position?: string;
  experience_years?: number;
  bio?: string;
  skills?: string[];
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  avatar_url?: string;
  is_approved: boolean;
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        // Get current user's session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }
        setCurrentUserId(session.user.id);

        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          throw error;
        }

        if (!profile) {
          toast.error('Profile not found');
          router.push('/');
          return;
        }

        // Check if user is approved or if it's their own profile
        if (!profile.is_approved && session.user.id !== profile.id) {
          toast.error('This profile is not yet approved');
          router.push('/');
          return;
        }

        setUser(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Error loading profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [params.id, router, supabase]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.name} />
            ) : (
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">
              {user.role === 'student' 
                ? `Student, Batch of ${user.batch_year}`
                : user.role === 'alumni'
                  ? `Alumni, Class of ${user.graduation_year}`
                  : 'Admin'}
            </p>
          </div>
        </div>
        {currentUserId !== user.id && (
          <ConnectButton userId={user.id} userName={user.name} />
        )}
      </div>

      <ProfileTabs user={user} isCurrentUser={currentUserId === user.id} />
    </div>
  );
} 