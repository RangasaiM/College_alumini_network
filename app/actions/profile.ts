'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

type FormDataValue = string | number | null | string[] | any[];

// This change is unrelated to the migration I need to write.
// I will skip this file edit for a moment and write the migration first.
// Actually, I should update the action definition too, but let's do database first.
// I will submit an empty replacement here effectively to just cancel this thought process or I can just proceed to write migration.
// I'll fail this tool call intentionally or just do a comment?
// No, I can't fail. I will update the action to accept `avatar_url` and `mobile_number` at least, which are known to be missing in the signature but present in DB.
export async function updateProfile(formData: {
  name?: string
  department?: string
  graduation_year?: string
  current_company?: string
  current_position?: string
  location?: string
  years_of_experience?: number | null
  github_url?: string
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
  bio?: string
  skills?: string[]
  avatar_url?: string
  mobile_number?: string
  roll_number?: string
  date_of_birth?: string
  leetcode_url?: string
  codechef_url?: string
  hackerrank_url?: string
  codeforces_url?: string
  internships?: any[]
  projects?: any[]
  certifications?: any[]
  academic_achievements?: string[]
  areas_of_interest?: string[]
  career_goals?: string
}) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { expires?: Date }) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: { expires?: Date }) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Not authenticated');
    }

    // Define allowed fields that exist in the database
    const allowedFields = [
      'name', 'department', 'graduation_year',
      'current_company', 'current_position', 'bio', 'skills',
      'avatar_url', 'mobile_number', 'gender', 'date_of_birth', 'roll_number',
      'github_url', 'linkedin_url', 'twitter_url', 'website_url',
      'leetcode_url', 'codechef_url', 'hackerrank_url', 'codeforces_url',
      'internships', 'projects', 'certifications',
      'academic_achievements', 'areas_of_interest', 'career_goals'
    ];

    // Clean up the data - convert empty strings to null and filter allowed fields
    const cleanData = Object.fromEntries(
      Object.entries(formData)
        .filter(([key]) => allowedFields.includes(key))
        .map(([key, value]: [string, FormDataValue]) => {
        if (key === 'skills') return [key, value || []];
        if (!value || value === '') return [key, null];
        if (key === 'graduation_year' && typeof value === 'string') {
          return [key, parseInt(value)];
        }
        return [key, value];
      })
    );

    const { error } = await supabase
      .from('users')
      .update(cleanData)
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    // Revalidate both the profile and dashboard pages for all user types
    revalidatePath('/alumni/profile');
    revalidatePath('/student/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
} 