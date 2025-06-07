import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const { action } = await request.json();

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Check if connection exists and user is the receiver
    const { data: connection, error: checkError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', params.id)
      .eq('connected_user_id', session.user.id)
      .single();

    if (checkError) {
      throw checkError;
    }

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection request not found' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      const { error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', params.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ message: 'Connection accepted' });
    } else {
      const { error: deleteError } = await supabase
        .from('connections')
        .delete()
        .eq('id', params.id);

      if (deleteError) {
        throw deleteError;
      }

      return NextResponse.json({ message: 'Connection rejected' });
    }
  } catch (error) {
    console.error('Error handling connection request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Check if connection exists and user is involved
    const { data: connection, error: checkError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', params.id)
      .or(`user_id.eq.${session.user.id},connected_user_id.eq.${session.user.id}`)
      .single();

    if (checkError) {
      throw checkError;
    }

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: 'Connection removed' });
  } catch (error) {
    console.error('Error removing connection:', error);
    return errorResponse(error);
  }
} 