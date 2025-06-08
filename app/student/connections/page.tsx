import { ConnectionsList } from '@/app/shared/connections/connections-list';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function acceptConnection(id: string) {
  'use server';
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

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  // First verify that this is a pending connection request to the current user
  const { data: connection, error: fetchError } = await supabase
    .from('connections')
    .select('*')
    .eq('id', id)
    .eq('receiver_id', session.user.id)
    .eq('status', 'pending')
    .single();

  if (fetchError || !connection) {
    console.error('Error fetching connection:', fetchError);
    throw new Error('Connection not found or not pending');
  }

  // Then update the status to accepted
  const { error: updateError } = await supabase
    .from('connections')
    .update({ status: 'accepted' })
    .eq('id', id)
    .eq('receiver_id', session.user.id)
    .eq('status', 'pending');
  
  if (updateError) {
    console.error('Error accepting connection:', updateError);
    throw updateError;
  }
}

async function rejectConnection(id: string) {
  'use server';
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

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', id)
    .eq('receiver_id', session.user.id);
  
  if (error) {
    console.error('Error rejecting connection:', error);
    throw error;
  }
}

async function removeConnection(id: string) {
  'use server';
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

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', id)
    .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
  
  if (error) {
    console.error('Error removing connection:', error);
    throw error;
  }
}

export default async function ConnectionsPage() {
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

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/signin');
  }

  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      id,
      status,
      requester:users!requester_id(
        id,
        name,
        role,
        department,
        current_company,
        current_position,
        avatar_url
      ),
      receiver:users!receiver_id(
        id,
        name,
        role,
        department,
        current_company,
        current_position,
        avatar_url
      )
    `)
    .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    .returns<{
      id: string;
      status: 'pending' | 'accepted';
      requester: {
        id: string;
        name: string;
        role: string;
        department: string;
        current_company: string | null;
        current_position: string | null;
        avatar_url: string | null;
      };
      receiver: {
        id: string;
        name: string;
        role: string;
        department: string;
        current_company: string | null;
        current_position: string | null;
        avatar_url: string | null;
      };
    }[]>();

  if (error) {
    console.error('Error fetching connections:', error);
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">My Connections</h1>
      <ConnectionsList 
        connections={connections || []}
        onAccept={acceptConnection}
        onReject={rejectConnection}
        onRemove={removeConnection}
      />
    </div>
  );
} 