import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { connectionSchema } from '@/lib/validations/schema';
import { 
  successResponse, 
  errorResponse, 
  unauthorizedResponse, 
  notFoundResponse 
} from '@/lib/utils/api-response';

// Get all connections for the current user
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

    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select(`
        *,
        user:users!connections_user_id_fkey(
          id,
          name,
          role,
          department,
          batch_year,
          graduation_year,
          current_company,
          current_role,
          experience_years,
          avatar_url
        )
      `)
      .eq('connected_user_id', session.user.id)
      .eq('status', 'accepted');

    if (connectionsError) {
      throw connectionsError;
    }

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new connection request
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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user_id.eq.${session.user.id},connected_user_id.eq.${userId}),and(user_id.eq.${userId},connected_user_id.eq.${session.user.id})`);

    if (checkError) {
      throw checkError;
    }

    if (existingConnection && existingConnection.length > 0) {
      return NextResponse.json(
        { error: 'Connection already exists' },
        { status: 400 }
      );
    }

    // Create new connection
    const { error: insertError } = await supabase.from('connections').insert([
      {
        user_id: session.user.id,
        connected_user_id: userId,
        status: 'pending',
      },
    ]);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ message: 'Connection request sent' });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: { expires?: Date }) {
          cookies().set(name, value, options);
        },
        remove(name: string, options: { expires?: Date }) {
          cookies().set(name, '', options);
        },
      },
    }
  );

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { connection_id, status } = await request.json();

    const { data, error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connection_id)
      .eq('receiver_id', session.user.id) // Ensure user can only update their received connections
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 