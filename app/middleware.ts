import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { cookies } from 'next/headers';

// Create a new ratelimiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    const pathname = req.nextUrl.pathname;
    console.log('Middleware: Starting check for path:', pathname);
    
    // Public routes that don't require authentication
    const publicRoutes = ['/', '/auth/signin', '/signup', '/signup-success', '/auth/error', '/pending-approval'];
    
    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith('/public/')
    );

    console.log('Middleware: Route info:', {
      path: pathname,
      isPublic: isPublicRoute
    });

    // Get session and verify it exists
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Middleware: Session error:', sessionError);
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    console.log('Middleware: Session status:', {
      exists: !!session,
      userId: session?.user?.id
    });

    // Allow access to public routes without authentication
    if (isPublicRoute) {
      console.log('Middleware: Allowing access to public route');
      
      // If user is authenticated and trying to access signin/signup, redirect to dashboard
      if (session && (pathname === '/auth/signin' || pathname === '/signup')) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, is_approved')
          .eq('id', session.user.id)
          .single();
          
        if (userData?.role && userData.is_approved) {
          console.log('Middleware: Authenticated user accessing public route, redirecting to dashboard');
          return NextResponse.redirect(new URL(`/${userData.role}/dashboard`, req.url));
        }
      }
      
      return res;
    }

    // If user is not signed in and trying to access a protected route
    if (!session) {
      console.log('Middleware: No session found, redirecting to signin');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Get user details including role and approval status
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('role, is_approved')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Middleware: Error fetching user data:', userError);
      // If the error is because the user doesn't exist, redirect to signup
      if (userError.code === 'PGRST116') {
        console.log('Middleware: User profile not found, redirecting to signup');
        return NextResponse.redirect(new URL('/signup', req.url));
      }
      return NextResponse.redirect(new URL('/auth/error', req.url));
    }

    // If no user details found, redirect to signup
    if (!userDetails) {
      console.log('Middleware: No user details found, redirecting to signup');
      return NextResponse.redirect(new URL('/signup', req.url));
    }

    console.log('Middleware: User status:', {
      id: session.user.id,
      role: userDetails.role,
      is_approved: userDetails.is_approved,
      path: pathname
    });

    // If user is not approved and trying to access any route except pending-approval
    if (!userDetails.is_approved && pathname !== '/pending-approval') {
      console.log('Middleware: User not approved, redirecting to pending-approval');
      return NextResponse.redirect(new URL('/pending-approval', req.url));
    }

    // Check if user is trying to access their role-specific routes
    const rolePrefix = `/${userDetails.role}`;
    if (!pathname.startsWith(rolePrefix) && !pathname.startsWith('/api/')) {
      console.log('Middleware: User accessing wrong role route, redirecting to correct dashboard');
      return NextResponse.redirect(new URL(`${rolePrefix}/dashboard`, req.url));
    }

    // Set session cookie with a longer expiration
    res.cookies.set({
      name: 'sb-session',
      value: session.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    console.log('Middleware: Access granted');
    return res;

  } catch (error) {
    console.error('Middleware: Unexpected error:', error);
    return NextResponse.redirect(new URL('/auth/error', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}; 