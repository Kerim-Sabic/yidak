import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';
import { ROLE_DASHBOARD_PATH, type Locale, type ProfileRole } from '@/lib/supabase/types';
const protectedRoutePrefixes = ['/customer', '/worker', '/admin'] as const;
const rolePrefixByRole: Readonly<Record<ProfileRole, (typeof protectedRoutePrefixes)[number]>> = {
  customer: '/customer',
  worker: '/worker',
  admin: '/admin',
};

const isLocale = (value: string): value is Locale => value === 'en' || value === 'ar';

const detectLocale = (request: NextRequest): Locale => {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get('accept-language') ?? '';
  if (acceptLanguage.toLowerCase().includes('ar')) {
    return 'ar';
  }

  return 'en';
};

const isPublicPath = (pathname: string): boolean => {
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return true;
  }

  if (pathname.startsWith('/icons/')) {
    return true;
  }

  return (
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  );
};

const withResponseCookies = (target: NextResponse, source: NextResponse): NextResponse => {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
};

const toLocaleRedirect = (request: NextRequest, locale: Locale): URL => {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${locale}${request.nextUrl.pathname}`;

  return redirectUrl;
};

const toPathWithLocale = (locale: Locale, path: string): string => `/${locale}${path}`;

const pathNeedsProtection = (path: string): boolean =>
  protectedRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const isRolePathMismatch = (path: string, role: ProfileRole): boolean => {
  const expectedPrefix = rolePrefixByRole[role];
  if (!pathNeedsProtection(path)) {
    return false;
  }

  return !(path === expectedPrefix || path.startsWith(`${expectedPrefix}/`));
};

export const middleware = async (request: NextRequest): Promise<NextResponse> => {
  const pathname = request.nextUrl.pathname;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = await updateSession(request);
  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0] ?? '';

  if (!isLocale(maybeLocale)) {
    const locale = detectLocale(request);
    const redirect = NextResponse.redirect(toLocaleRedirect(request, locale));
    return withResponseCookies(redirect, session.response);
  }

  const locale = maybeLocale;
  const pathWithoutLocale = `/${segments.slice(1).join('/')}`;
  const authPath = pathWithoutLocale === '/login' || pathWithoutLocale === '/signup';

  if (authPath && session.user) {
    const targetRole = session.role ?? 'customer';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = toPathWithLocale(locale, ROLE_DASHBOARD_PATH[targetRole]);
    return withResponseCookies(NextResponse.redirect(redirectUrl), session.response);
  }

  if (pathNeedsProtection(pathWithoutLocale) && !session.user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = toPathWithLocale(locale, '/login');
    redirect.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return withResponseCookies(NextResponse.redirect(redirect), session.response);
  }

  if (session.user && isRolePathMismatch(pathWithoutLocale, session.role ?? 'customer')) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = toPathWithLocale(locale, '/unauthorized');
    return withResponseCookies(NextResponse.redirect(redirect), session.response);
  }

  return session.response;
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
