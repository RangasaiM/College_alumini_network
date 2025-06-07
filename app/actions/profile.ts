'use server';

import { createClient } from '@/utils/supabase/server';
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
    const supabase = await createClient();

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('users')
      .update(cleanData)
      .eq('id', user.id);

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