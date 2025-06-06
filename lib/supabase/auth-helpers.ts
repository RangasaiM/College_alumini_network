import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { Database } from "./database.types";

// Create a cached version of the Supabase client
export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ 
    cookies: () => cookieStore 
  });
});

// Get the current session
export async function getSession() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

// Get user details with error handling
export async function getUserDetails() {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getSession();
    
    if (!session?.user?.id) {
      return null;
    }

    const { data: userDetails, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (error) {
      console.error("Error getting user details:", error);
      return null;
    }

    return userDetails;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Get approved users with optional role filter
export async function getApprovedUsers(role?: string) {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("users")
      .select("*")
      .eq("is_approved", true);
    
    if (role) {
      query = query.eq("role", role);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error getting approved users:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Get pending users
export async function getPendingUsers() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_approved", false);
    
    if (error) {
      console.error("Error getting pending users:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}