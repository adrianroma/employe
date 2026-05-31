import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

const handleI18n = createMiddleware(routing);

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('rbeas_token')?.value;
  const path = request.nextUrl.pathname;

  // Protect dashboard, admin, employee and api/admin routes
  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/employee') ||
    path.startsWith('/api/admin')
  ) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const decoded = decodeJwt(token);
    if (!decoded || !decoded.role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (
      (path.startsWith('/admin') || path.startsWith('/api/admin')) &&
      decoded.role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/employee', request.url));
    }

    if (path.startsWith('/employee') && decoded.role !== 'employee') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // API routes don't need locale detection
    if (path.startsWith('/api/')) {
      return NextResponse.next();
    }
  }

  // Redirect signed-in users away from auth pages
  if (path === '/login' || path === '/register') {
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && (!decoded.exp || Date.now() < decoded.exp * 1000)) {
        const dest = decoded.role === 'admin' ? '/admin' : '/employee';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  return handleI18n(request);
}

export const config = {
  matcher: [
    // All page routes (for auth + locale detection), excluding static assets
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Admin API routes (for auth)
    '/api/admin/:path*',
  ],
};

export default proxy;
