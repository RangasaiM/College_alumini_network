import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';

// Base schema for all users
const baseUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  department: z.string(),
  bio: z.string().optional(),
});

// Student-specific schema
const studentSchema = baseUserSchema.extend({
  role: z.literal('student'),
  batch_year: z.number().int().min(2000),
  github_url: z.string().url().optional(),
  leetcode_url: z.string().url().optional(),
  codechef_url: z.string().url().optional(),
  codeforces_url: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
});

// Alumni-specific schema
const alumniSchema = baseUserSchema.extend({
  role: z.literal('alumni'),
  graduation_year: z.number().int().min(2000),
  current_company: z.string().optional(),
  current_role: z.string().optional(),
  experience_years: z.number().min(0).optional(),
  is_mentorship_available: z.boolean(),
  linkedin_url: z.string().url().optional(),
  github_url: z.string().url().optional(),
  portfolio_url: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
});

// Admin-specific schema
const adminSchema = baseUserSchema.extend({
  role: z.literal('admin'),
  position: z.string(),
  linkedin_url: z.string().url().optional(),
  github_url: z.string().url().optional(),
});

// Combined schema for all user types
const userSchema = z.discriminatedUnion('role', [
  studentSchema,
  alumniSchema,
  adminSchema,
]);

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const validatedData = userSchema.parse(body);

    const { error } = await supabase
      .from('users')
      .update(validatedData)
      .eq('id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', true)
      .neq('id', session.user.id);

    if (usersError) {
      throw usersError;
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 