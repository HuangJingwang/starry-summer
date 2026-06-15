import { createHmac, timingSafeEqual } from 'node:crypto';

export interface AdminSessionPayload {
  email: string;
  expiresAt: string;
}

export type AdminRouteAccessDecision =
  | {
      action: 'allow';
    }
  | {
      action: 'redirect';
      destination: string;
    };

export interface AdminRouteAccessInput {
  pathname: string;
  search: string;
  sessionToken?: string;
  sessionSecret: string;
  adminEmail?: string;
  now?: number;
}

export const ADMIN_SESSION_COOKIE = 'ss_session';
const defaultSessionSecret = 'development-session-secret';

export interface AdminSessionSecretEnv {
  NODE_ENV?: string;
  SESSION_SECRET?: string;
}

export function resolveAdminSessionSecret(env: AdminSessionSecretEnv): string {
  const sessionSecret = env.SESSION_SECRET ?? defaultSessionSecret;

  if (
    env.NODE_ENV === 'production' &&
    (sessionSecret.length < 32 ||
      sessionSecret.startsWith('replace-') ||
      sessionSecret.startsWith('change-') ||
      sessionSecret === defaultSessionSecret)
  ) {
    throw new Error('SESSION_SECRET must be at least 32 characters and not a placeholder in production');
  }

  return sessionSecret;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  sessionSecret: string,
  now = Date.now(),
  adminEmail?: string,
): AdminSessionPayload | null {
  if (!token || !sessionSecret) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(encodedPayload, sessionSecret);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<AdminSessionPayload>;

    if (
      !payload.email ||
      (adminEmail && payload.email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) ||
      !payload.expiresAt ||
      Date.parse(payload.expiresAt) <= now
    ) {
      return null;
    }

    return {
      email: payload.email,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export function createAdminSessionToken(payload: AdminSessionPayload, sessionSecret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

  return `${encodedPayload}.${signSessionPayload(encodedPayload, sessionSecret)}`;
}

export function getAdminRouteAccessDecision(input: AdminRouteAccessInput): AdminRouteAccessDecision {
  const session = verifyAdminSessionToken(input.sessionToken, input.sessionSecret, input.now, input.adminEmail);

  if (isAdminLoginPath(input.pathname)) {
    return session ? { action: 'redirect', destination: '/admin' } : { action: 'allow' };
  }

  if (!isProtectedAdminPath(input.pathname)) {
    return { action: 'allow' };
  }

  if (session) {
    return { action: 'allow' };
  }

  const next = `${input.pathname}${input.search}`;

  return {
    action: 'redirect',
    destination: `/admin/login?next=${encodeURIComponent(next)}`,
  };
}

function isAdminLoginPath(pathname: string): boolean {
  return pathname === '/admin/login';
}

function isProtectedAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function signSessionPayload(encodedPayload: string, sessionSecret: string): string {
  return createHmac('sha256', sessionSecret).update(encodedPayload).digest('base64url');
}
