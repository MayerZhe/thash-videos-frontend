import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/landing',
  '/login',
  '/register',
  '/logout',
  '/verify-email',
  '/auth',
  '/video',
  '/short-video',
  '/dashboard',
] as const;

const ALWAYS_PUBLIC_PREFIXES = ['/_next', '/api', '/favicon.ico', '/logo.png'] as const;

function isPublicPath(pathname: string): boolean {
  // Exact or prefix match for public paths.
  // Guard p !== '/' prevents '//' prefix from p + '/' when p is the root path.
  if (PUBLIC_PATHS.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')))) {
    return true;
  }
  // Always-public asset/API prefixes
  if (ALWAYS_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('thash_auth_token')?.value;

  if (!token) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (logo asset)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|logo\\.png).*)',
  ],
};
