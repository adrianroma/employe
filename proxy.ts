import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

const handleI18n = createMiddleware(routing);

function stripLocale(path: string): { locale: string | null; normalizedPath: string } {
  for (const locale of routing.locales) {
    if (path.startsWith(`/${locale}/`)) {
      return { locale, normalizedPath: path.slice(locale.length + 1) };
    }
    if (path === `/${locale}`) {
      return { locale, normalizedPath: '/' };
    }
  }
  return { locale: null, normalizedPath: path };
}

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
  const { locale: pathLocale, normalizedPath } = stripLocale(path);

  // Resolve the locale to use in redirect URLs
  const locale =
    pathLocale ??
    request.cookies.get('NEXT_LOCALE')?.value ??
    routing.defaultLocale;

  // API admin routes — no locale prefix, auth only
  if (path.startsWith('/api/admin')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.role)
      return NextResponse.redirect(new URL('/login', request.url));
    if (decoded.exp && Date.now() >= decoded.exp * 1000)
      return NextResponse.redirect(new URL('/login', request.url));
    if (decoded.role !== 'admin')
      return NextResponse.redirect(new URL(`/${locale}/employee`, request.url));
    return NextResponse.next();
  }

  // Protected page routes — paths arrive as /es/admin, /en/employee, etc.
  if (
    normalizedPath.startsWith('/dashboard') ||
    normalizedPath.startsWith('/admin') ||
    normalizedPath.startsWith('/employee')
  ) {
    if (!token)
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));

    const decoded = decodeJwt(token);
    if (!decoded || !decoded.role)
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));

    if (decoded.exp && Date.now() >= decoded.exp * 1000)
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));

    if (normalizedPath.startsWith('/admin') && decoded.role !== 'admin')
      return NextResponse.redirect(new URL(`/${locale}/employee`, request.url));

    if (normalizedPath.startsWith('/employee') && decoded.role !== 'employee')
      return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
  }

  // Redirect already-signed-in users away from auth pages
  if (normalizedPath === '/login' || normalizedPath === '/register') {
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && (!decoded.exp || Date.now() < decoded.exp * 1000)) {
        const dest = decoded.role === 'admin' ? 'admin' : 'employee';
        return NextResponse.redirect(new URL(`/${locale}/${dest}`, request.url));
      }
    }
  }

  return handleI18n(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/api/admin/:path*',
  ],
};

export default proxy;
