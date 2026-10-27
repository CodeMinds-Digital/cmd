import { NextResponse, type NextRequest } from 'next/server';
import { sessionCookieName } from '@codeminds/cms/session';

/**
 * Every response: a per-request nonce CSP and the security headers below.
 * Protected pages without a session cookie go straight to /login; the real
 * session, role and two-factor checks run on the server in each page and
 * action (lib/auth.ts), never only here.
 */
const PUBLIC = ['/login', '/forgot-password', '/reset-password', '/robots.txt'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Behind Dokploy's proxy TLS ends upstream, so trust its forwarded protocol.
  const https = request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

  if (!isPublic && !request.cookies.has(sessionCookieName())) {
    // APIs answer, pages redirect (a redirected POST would land on /login as a bogus form action).
    if (pathname.startsWith('/api/')) return withHeaders(NextResponse.json({ error: 'Sign in first.' }, { status: 401 }), csp(nonce(), https), https);
    const login = new URL('/login', request.url);
    if (pathname !== '/') login.searchParams.set('next', pathname + search);
    return withHeaders(NextResponse.redirect(login), csp(nonce(), https), https);
  }

  const n = nonce();
  const policy = csp(n, https);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', n);
  requestHeaders.set('Content-Security-Policy', policy);
  return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }), policy, https);
}

function nonce() {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

function csp(n: string, https: boolean) {
  const dev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${n}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self'${dev ? " 'unsafe-inline'" : ` 'nonce-${n}'`}`,
    `img-src 'self' data: blob:${imageOrigins()}`,
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

/** Admin thumbnails: uploaded images (Appwrite Storage) and the site's built-in images. */
function imageOrigins() {
  const origins = [process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, process.env.SITE_URL].flatMap((u) => {
    try {
      return u ? [new URL(u).origin] : [];
    } catch {
      return [];
    }
  });
  return origins.map((o) => ` ${o}`).join('');
}

function withHeaders(response: NextResponse, policy: string, https: boolean) {
  const h = response.headers;
  h.set('Content-Security-Policy', policy);
  h.set('X-Frame-Options', 'DENY');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'no-referrer');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  h.set('Cache-Control', 'no-store');
  if (https) h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  return response;
}

export const config = {
  matcher: [
    // Everything except static build output and the favicon.
    { source: '/((?!_next/static|_next/image|favicon.ico).*)' },
  ],
};
