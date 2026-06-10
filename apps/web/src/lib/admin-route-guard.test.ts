import { createHmac } from 'node:crypto';

import { describe, expect, test } from 'vitest';

import { getAdminRouteAccessDecision, resolveAdminSessionSecret, verifyAdminSessionToken } from './admin-route-guard';

const sessionSecret = 'test-session-secret';
const now = Date.parse('2026-06-11T00:00:00.000Z');

function createSessionToken(input: { email: string; expiresAt: string }, secret = sessionSecret): string {
  const encodedPayload = Buffer.from(JSON.stringify(input), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  return `${encodedPayload}.${signature}`;
}

describe('admin route guard helpers', () => {
  test('redirects protected admin pages without a valid session', () => {
    expect(
      getAdminRouteAccessDecision({
        pathname: '/admin/content',
        search: '?status=draft',
        sessionToken: undefined,
        sessionSecret,
        now,
      }),
    ).toEqual({
      action: 'redirect',
      destination: '/admin/login?next=%2Fadmin%2Fcontent%3Fstatus%3Ddraft',
    });
  });

  test('allows the login page without a session', () => {
    expect(
      getAdminRouteAccessDecision({
        pathname: '/admin/login',
        search: '',
        sessionToken: undefined,
        sessionSecret,
        now,
      }),
    ).toEqual({ action: 'allow' });
  });

  test('allows protected admin pages with a valid API-compatible session token', () => {
    const token = createSessionToken({
      email: 'owner@example.com',
      expiresAt: '2026-06-11T08:00:00.000Z',
    });

    expect(verifyAdminSessionToken(token, sessionSecret, now)).toEqual({
      email: 'owner@example.com',
      expiresAt: '2026-06-11T08:00:00.000Z',
    });
    expect(
      getAdminRouteAccessDecision({
        pathname: '/admin/projects',
        search: '',
        sessionToken: token,
        sessionSecret,
        adminEmail: 'owner@example.com',
        now,
      }),
    ).toEqual({ action: 'allow' });
  });

  test('redirects the login page to admin home when the session is already valid', () => {
    const token = createSessionToken({
      email: 'owner@example.com',
      expiresAt: '2026-06-11T08:00:00.000Z',
    });

    expect(
      getAdminRouteAccessDecision({
        pathname: '/admin/login',
        search: '',
        sessionToken: token,
        sessionSecret,
        adminEmail: 'owner@example.com',
        now,
      }),
    ).toEqual({
      action: 'redirect',
      destination: '/admin',
    });
  });

  test('rejects expired and tampered session tokens', () => {
    const expired = createSessionToken({
      email: 'owner@example.com',
      expiresAt: '2026-06-10T23:59:59.000Z',
    });
    const valid = createSessionToken({
      email: 'owner@example.com',
      expiresAt: '2026-06-11T08:00:00.000Z',
    });

    expect(verifyAdminSessionToken(expired, sessionSecret, now)).toBeNull();
    expect(verifyAdminSessionToken(`${valid.slice(0, -1)}x`, sessionSecret, now)).toBeNull();
  });

  test('rejects signed session tokens for a different admin email', () => {
    const token = createSessionToken({
      email: 'other@example.com',
      expiresAt: '2026-06-11T08:00:00.000Z',
    });

    expect(verifyAdminSessionToken(token, sessionSecret, now, 'owner@example.com')).toBeNull();
    expect(
      getAdminRouteAccessDecision({
        pathname: '/admin/content',
        search: '',
        sessionToken: token,
        sessionSecret,
        adminEmail: 'owner@example.com',
        now,
      }),
    ).toEqual({
      action: 'redirect',
      destination: '/admin/login?next=%2Fadmin%2Fcontent',
    });
  });

  test('rejects weak admin session secrets in production', () => {
    expect(() =>
      resolveAdminSessionSecret({
        NODE_ENV: 'production',
        SESSION_SECRET: 'development-session-secret',
      }),
    ).toThrow('SESSION_SECRET must be at least 32 characters and not a placeholder in production');
    expect(
      resolveAdminSessionSecret({
        NODE_ENV: 'production',
        SESSION_SECRET: '12345678901234567890123456789012',
      }),
    ).toBe('12345678901234567890123456789012');
  });
});
