import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Check if the user already exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('is_approved')
        .eq('id', session.user.id)
        .single();

      if (!existingUser) {
        // This is a new signup - create user record with is_approved = false
        await supabase.from('users').insert([
          {
            id: session.user.id,
            email: session.user.email,
            role: 'student', // Default role
            is_approved: false,
          },
        ]);
      }

      // Check if user is approved
      if (existingUser?.is_approved) {
        // Redirect approved users to their dashboard
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const dashboardPath = userData?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
        return NextResponse.redirect(new URL(dashboardPath, requestUrl.origin));
      }

      // Redirect unapproved users to pending approval page
      return NextResponse.redirect(new URL('/pending-approval', requestUrl.origin));
    }
  }

  // Redirect to home page if there's no code or session
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 