import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

    // Check if user is already an admin
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (checkError) {
      throw checkError;
    }

    if (existingAdmin?.role === 'admin') {
      return NextResponse.json(
        { error: 'User is already an admin' },
        { status: 400 }
      );
    }

    // Update user role to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', session.user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ message: 'Admin setup completed' });
  } catch (error) {
    console.error('Error setting up admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 