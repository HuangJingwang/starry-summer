import { createHmac } from 'node:crypto';
import { describe, expect, test } from 'vitest';

import { isRepositoryRouteAuthorized } from './repository-route-auth';

function createSessionToken(input: { email: string; expiresAt: string }, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(input), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  return `${encodedPayload}.${signature}`;
}

describe('repository route authorization', () => {
  test('allows machine publishing with the configured repository publish secret', () => {
    expect(
      isRepositoryRouteAuthorized({
        headers: new Headers({ 'x-repository-publish-secret': 'repo-secret' }),
        env: {
          REPOSITORY_PUBLISH_SECRET: 'repo-secret',
          SESSION_SECRET: 'session-secret',
        },
      }),
    ).toBe(true);
  });

  test('allows browser publishing with a valid admin session cookie', () => {
    const sessionSecret = 'test-session-secret';
    const token = createSessionToken(
      {
        email: 'owner@example.com',
        expiresAt: '2026-06-14T12:00:00.000Z',
      },
      sessionSecret,
    );

    expect(
      isRepositoryRouteAuthorized({
        cookieHeader: `theme=dark; ss_session=${token}`,
        now: Date.parse('2026-06-14T08:00:00.000Z'),
        env: {
          ADMIN_EMAIL: 'owner@example.com',
          SESSION_SECRET: sessionSecret,
        },
      }),
    ).toBe(true);
  });

  test('rejects missing or mismatched publishing credentials', () => {
    expect(
      isRepositoryRouteAuthorized({
        cookieHeader: '',
        headers: new Headers({ 'x-repository-publish-secret': 'wrong' }),
        env: {
          REPOSITORY_PUBLISH_SECRET: 'repo-secret',
          SESSION_SECRET: 'session-secret',
        },
      }),
    ).toBe(false);
  });
});
