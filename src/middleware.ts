import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from './lib/session';

export async function middleware(request: NextRequest) {
  // 0. Enforce HTTPS in production environments
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https' &&
    !request.headers.get('host')?.includes('localhost')
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }

  const sessionToken = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Exclude public assets, static files and the login API/page from checks
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 1b. Allow secure external Power BI dashboard queries via token
  if (pathname === '/api/powerbi') {
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.POWERBI_TOKEN;
    if (expectedToken && authHeader === `Bearer ${expectedToken}`) {
      return NextResponse.next();
    }
  }

  // 2. Verify Session
  let session = null;
  if (sessionToken) {
    session = await decryptSession(sessionToken);
  }

  // 3. Handle unauthorized access
  if (!session) {
    // If it's an API route, return 401 JSON to secure backend
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Inicie sesión para acceder a este recurso.' },
        { status: 401 }
      );
    }

    // Otherwise, redirect to login page
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    // Clear cookie to ensure no stale invalid cookies remain
    response.cookies.delete('session_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Execute middleware on all routes except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
