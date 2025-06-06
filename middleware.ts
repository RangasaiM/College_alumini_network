import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/signin', '/auth/signup'];
  
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

  // If user is signed in
  if (session) {
    // Get the user's approval status
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_approved, role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return res;
    }

    // If user exists and is not approved
    if (userData && !userData.is_approved) {
      // Allow access to the pending approval page and signout
      if (['/pending-approval', '/auth/signout'].includes(req.nextUrl.pathname)) {
        return res;
      }
      // Redirect to pending approval page for all other routes
      return NextResponse.redirect(new URL('/pending-approval', req.url));
    }

    // If user is approved and trying to access pending approval page, redirect to dashboard
    if (userData?.is_approved && req.nextUrl.pathname === '/pending-approval') {
      const dashboardPath = userData.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }

    // If user is approved and accessing auth pages, redirect to appropriate dashboard
    if (userData?.is_approved && ['/auth/signin', '/auth/signup'].includes(req.nextUrl.pathname)) {
      const dashboardPath = userData.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }
  }

  return res;
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