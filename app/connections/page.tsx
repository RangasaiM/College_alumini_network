import { ConnectionsList } from '@/app/shared/connections/connections-list';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
        id, name, role, department, current_company, current_position, avatar_url
      ),
      receiver:users!receiver_id(
        id, name, role, department, current_company, current_position, avatar_url
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
        onAccept={async (id) => {
          'use server';
          const { error } = await supabase
            .from('connections')
            .update({ status: 'accepted' })
            .eq('id', id);
          if (error) throw error;
        }}
        onReject={async (id) => {
          'use server';
          const { error } = await supabase
            .from('connections')
            .delete()
            .eq('id', id);
          if (error) throw error;
        }}
        onRemove={async (id) => {
          'use server';
          const { error } = await supabase
            .from('connections')
            .delete()
            .eq('id', id);
          if (error) throw error;
        }}
      />
    </div>
  );
} 