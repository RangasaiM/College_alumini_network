import { createServerClient, createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { Database } from "./database.types";

// Add type definition
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  batch_year: number | null;
  graduation_year: number | null;
  current_company: string | null;
  current_position: string | null;
  location: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Server-side functions
export const getServerSupabase = cache(() => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', options);
        },
      },
    }
  );
});

// Get the user's session
export const getSession = cache(async () => {
  const supabase = getServerSupabase();
  try {
    console.log('Auth Helper: Getting server session');
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth Helper: Session error:', error);
      return null;
    }

    console.log('Auth Helper: Session status:', {
      exists: !!session,
      userId: session?.user?.id
    });

    return session;
  } catch (error) {
    console.error('Auth Helper: Unexpected error:', error);
    return null;
  }
});

export const getServerUserDetails = cache(async () => {
  console.log('Auth Helper: Getting user details');
  const session = await getSession();
  
  if (!session?.user?.id) {
    console.log('Auth Helper: No session for user details');
    return null;
  }

  const supabase = getServerSupabase();
  try {
    // First, check if the user exists with minimal fields
    const { data: basicUserData, error: basicError } = await supabase
      .from('users')
      .select('id, email, name, role, is_approved')
      .eq('id', session.user.id)
      .single();

    if (basicError) {
      console.error('Auth Helper: Error fetching basic user details:', basicError);
      return null;
    }

    if (!basicUserData) {
      console.log('Auth Helper: No user profile found');
      return null;
    }

    // Then try to get all fields, but handle gracefully if some don't exist
    try {
      const { data: fullUserData, error: fullError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          department,
          batch_year,
          graduation_year,
          current_company,
          current_position,
          location,
          bio,
          linkedin_url,
          github_url,
          twitter_url,
          website_url,
          avatar_url,
          is_approved,
          created_at,
          updated_at
        `)
        .eq('id', session.user.id)
        .single();

      if (fullError) {
        console.log('Auth Helper: Some fields might be missing, using basic data:', fullError);
        return basicUserData;
      }

      console.log('Auth Helper: User details found:', {
        id: fullUserData?.id,
        role: fullUserData?.role,
        is_approved: fullUserData?.is_approved
      });

      return fullUserData;
    } catch (error) {
      console.log('Auth Helper: Error fetching full user details, using basic data:', error);
      return basicUserData;
    }
  } catch (error) {
    console.error('Auth Helper: Error in getServerUserDetails:', error);
    return null;
  }
});

// Client-side functions
export const getClientUserDetails = async () => {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) return null;

  const { data: userDetails } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      role,
      department,
      batch_year,
      graduation_year,
      current_company,
      current_position,
      location,
      bio,
      linkedin_url,
      github_url,
      twitter_url,
      website_url,
      avatar_url,
      is_approved,
      created_at,
      updated_at
    `)
    .eq('id', session.user.id)
    .single();

  return userDetails;
};

// Get user details
export async function getUserDetails(): Promise<UserProfile | null> {
  const supabase = getServerSupabase();
  const session = await getSession();
  
  if (!session?.user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      role,
      department,
      batch_year,
      graduation_year,
      current_company,
      current_position,
      location,
      bio,
      linkedin_url,
      github_url,
      twitter_url,
      website_url,
      avatar_url,
      is_approved,
      created_at,
      updated_at
    `)
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error getting user details:', error);
    return null;
  }

  return data;
}

// Get approved users with optional role filter
export async function getApprovedUsers(role?: string): Promise<UserProfile[]> {
  const supabase = getServerSupabase();
  const { data: users, error } = await supabase
    .rpc('get_all_user_profiles');

  if (error) {
    console.error('Error getting approved users:', error);
    return [];
  }

  if (role) {
    return users.filter((user: UserProfile) => user.role === role);
  }

  return users;
}

// Get pending users for admin approval
export async function getPendingUsers(): Promise<UserProfile[]> {
  const supabase = getServerSupabase();
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      role,
      department,
      batch_year,
      graduation_year,
      current_company,
      current_position,
      location,
      bio,
      linkedin_url,
      github_url,
      twitter_url,
      website_url,
      avatar_url,
      is_approved,
      created_at,
      updated_at
    `)
    .eq('is_approved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting pending users:', error);
    return [];
  }

  return users || [];
}

// Get server-side session
export const getServerSession = cache(async () => {
  const supabase = getServerSupabase();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
});