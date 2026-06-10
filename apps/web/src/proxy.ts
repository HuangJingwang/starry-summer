import { NextResponse, type NextRequest } from 'next/server';

import { ADMIN_SESSION_COOKIE, getAdminRouteAccessDecision, resolveAdminSessionSecret } from './lib/admin-route-guard';

export function proxy(request: NextRequest) {
  const decision = getAdminRouteAccessDecision({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    sessionToken: request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    sessionSecret: resolveAdminSessionSecret(process.env),
    adminEmail: process.env.ADMIN_EMAIL,
  });

  if (decision.action === 'allow') {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(decision.destination, request.url));
}

export const config = {
  matcher: ['/admin/:path*'],
};
