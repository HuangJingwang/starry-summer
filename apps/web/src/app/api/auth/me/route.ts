import { NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE } from '@/lib/admin-route-guard';
import { readAdminSession } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = readAdminSession(getCookieValue(request.headers.get('cookie') ?? '', ADMIN_SESSION_COOKIE));

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(session);
}

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  for (const segment of cookieHeader.split(';')) {
    const [key = '', ...valueParts] = segment.trim().split('=');

    if (key === name) {
      return valueParts.join('=');
    }
  }

  return undefined;
}
