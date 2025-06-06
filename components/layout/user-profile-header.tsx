"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { User } from "@supabase/supabase-js";
import { AvatarUpload } from "@/components/profile/avatar-upload";

interface UserProfile {
  name: string;
  avatar_url: string | null;
}

export function UserProfileHeader() {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserProfile | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserDetails({
            name: profile.name as string,
            avatar_url: profile.avatar_url as string | null
          });
        }
      }
    };

    getUser();
  }, [supabase]);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setUserDetails(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
  };

  if (!user || !userDetails) return null;

  return (
    <div className="flex items-center gap-4">
      <AvatarUpload
        userId={user.id}
        currentAvatarUrl={userDetails.avatar_url}
        userName={userDetails.name}
        onAvatarUpdate={handleAvatarUpdate}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{userDetails.name}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
    </div>
  );
} 