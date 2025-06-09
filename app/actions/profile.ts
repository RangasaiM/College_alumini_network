'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

type FormDataValue = string | number | null | string[];

export async function updateProfile(formData: {
  name?: string
  department?: string
  batch_year?: string
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

    // Clean up the data - convert empty strings to null
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([key, value]: [string, FormDataValue]) => {
        if (key === 'skills') return [key, value || []];
        if (!value || value === '') return [key, null];
        if ((key === 'batch_year' || key === 'graduation_year') && typeof value === 'string') {
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