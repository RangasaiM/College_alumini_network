'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCard } from '@/app/shared/users/user-card';

type NetworkSectionProps = {
  userRole: 'student' | 'alumni';
};

export function NetworkSection({ userRole }: NetworkSectionProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', userRole === 'student' ? 'alumni' : 'student')
          .eq('is_approved', true)
          .limit(3);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userRole, supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect with {userRole === 'student' ? 'Alumni' : 'Students'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
          <Button asChild className="w-full">
            <Link href="/discover">View More</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 