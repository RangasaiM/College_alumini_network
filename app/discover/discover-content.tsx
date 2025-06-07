'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCard } from "@/app/shared/users/user-card";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ConnectButton } from "@/app/shared/users/connect-button";

export function DiscoverContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'student' | 'alumni' | 'admin'>('student');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchUsers = async () => {
    try {
      // Get current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      setCurrentUserId(session.user.id);

      // Get current user's role
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (currentUserError) throw currentUserError;
      setCurrentUserRole(currentUser.role);

      let query = supabase
        .from('users')
        .select('*')
        .eq('is_approved', true)
        .neq('id', session.user.id) // Exclude current user
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      } else if (currentUser.role !== 'admin') {
        // If not admin and no specific role filter, show all relevant users
        query = query.in('role', [currentUser.role === 'student' ? 'student' : 'alumni', currentUser.role === 'student' ? 'alumni' : 'student']);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower) ||
      user.company?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discover People</h1>
        <p className="text-muted-foreground">
          {currentUserRole === 'admin' 
            ? 'View and manage all users in the network.'
            : currentUserRole === 'student'
              ? 'Connect with fellow students and alumni to explore opportunities and get guidance.'
              : 'Connect with fellow alumni and students to share experiences and provide mentorship.'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, department, company..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Filter by Role</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {currentUserRole === 'admin' ? (
                <>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </>
              ) : currentUserRole === 'student' ? (
                <>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="student">Fellow Students</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="alumni">Fellow Alumni</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-muted-foreground col-span-full">
            No users found matching your criteria.
          </p>
        ) : (
          filteredUsers.map((user) => (
            <UserCard 
              key={user.id} 
              user={user}
              actions={
                currentUserRole !== 'admin' && (
                  <ConnectButton 
                    userId={user.id}
                    userName={user.name}
                    onSuccess={fetchUsers}
                  />
                )
              }
            />
          ))
        )}
      </div>
    </div>
  );
} 