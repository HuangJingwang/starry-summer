import { NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE } from '@/lib/admin-route-guard';
import { loginAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const input = (await request.json().catch(() => ({}))) as {
    account?: string;
    email?: string;
    password?: string;
  };
  const session = loginAdmin(input);

  if (!session) {
    return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
  }

  const response = NextResponse.json({
    email: session.email,
    expiresAt: session.expiresAt,
  });

  response.cookies.set(ADMIN_SESSION_COOKIE, session.token, {
    httpOnly: true,
    maxAge: session.maxAgeSeconds,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
