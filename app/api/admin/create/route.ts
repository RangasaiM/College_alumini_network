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

        // Check if current user is admin
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (userError) {
            throw userError;
        }

        if (currentUser?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only admins can create other admins' },
                { status: 403 }
            );
        }

        const { email, name, password } = await request.json();

        if (!email || !name || !password) {
            return NextResponse.json(
                { error: 'Email, name, and password are required' },
                { status: 400 }
            );
        }

        // Create new admin user
        const { data: newUser, error: createError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role: 'admin',
                },
            },
        });

        if (createError) {
            throw createError;
        }

        if (!newUser.user) {
            throw new Error('Failed to create user');
        }

        // Create admin profile
        const { error: profileError } = await supabase.from('users').insert([
            {
                id: newUser.user.id,
                email,
                name,
                role: 'admin',
                is_approved: true,
            },
        ]);

        if (profileError) {
            throw profileError;
        }

        return NextResponse.json({ message: 'Admin created successfully' });
    } catch (error) {
        console.error('Error creating admin:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 