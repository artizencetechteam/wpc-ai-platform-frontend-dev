import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access-token')?.value;
  const userInfoCookie = request.cookies.get('user-info')?.value;
  const { pathname } = request.nextUrl;

  // Guest routes: If user is logged in, redirect away from these
  const isGuestRoute = pathname.startsWith('/auth') || pathname.startsWith('/welcome');
  
  // Protected routes: If user is NOT logged in, redirect to login
  const isProtectedRoute = pathname.startsWith('/employer') || pathname.startsWith('/dashboard');

  if (accessToken && isGuestRoute) {
    let dashboardPath = '/employer/dashboard';
    if (userInfoCookie) {
      try {
        const userInfo = JSON.parse(decodeURIComponent(userInfoCookie));
        if (userInfo.role) {
          dashboardPath = `/${userInfo.role}/dashboard`;
        }
      } catch (e) {
        console.error('Middleware: Error parsing user-info cookie', e);
      }
    }
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  if (!accessToken && isProtectedRoute) {
    // Optionally save the attempted URL to redirect back after login
    const loginUrl = new URL('/auth/employer/login', request.url);
    // loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/auth/:path*',
    '/welcome/:path*',
    '/employer/:path*',
    '/dashboard/:path*'
  ],
};
