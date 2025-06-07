import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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
        set(name: string, value: string, options: { expires?: Date }) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: { expires?: Date }) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/auth/signin', '/signup', '/signup-success', '/auth/error'];
    
    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => 
      req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith('/public/')
    );

    // Allow access to public routes without authentication
    if (isPublicRoute) {
      return res;
    }

    // If user is not signed in and trying to access a protected route
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Get user details including role and approval status
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('role, is_approved')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.redirect(new URL('/auth/error', req.url));
    }

    // If no user details found, redirect to signup
    if (!userDetails) {
      return NextResponse.redirect(new URL('/signup', req.url));
    }

    // If user is not approved and trying to access any route except pending-approval
    if (!userDetails.is_approved && !req.nextUrl.pathname.startsWith('/pending-approval')) {
      return NextResponse.redirect(new URL('/pending-approval', req.url));
    }

    // If user is approved but trying to access pending-approval
    if (userDetails.is_approved && req.nextUrl.pathname.startsWith('/pending-approval')) {
      return NextResponse.redirect(new URL(`/${userDetails.role}/dashboard`, req.url));
    }

    // Handle role-specific routes
    if (req.nextUrl.pathname.startsWith('/admin') && userDetails.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/student') && userDetails.role !== 'student') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/alumni') && userDetails.role !== 'alumni') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
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