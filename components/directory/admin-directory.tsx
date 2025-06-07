import { getServerSupabase } from "@/lib/supabase/auth-helpers";
import { UserDirectoryClient } from "./user-directory-client";

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  is_approved: boolean;
  department?: string;
  graduation_year?: number;
  created_at: string;
}

async function getUsers(): Promise<User[]> {
  const supabase = getServerSupabase();
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return users || [];
}

export async function AdminDirectory() {
  const users = await getUsers();

  return (
    <div className="space-y-4">
      <UserDirectoryClient initialUsers={users} />
    </div>
  );
} 