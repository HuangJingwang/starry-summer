import { describe, expect, test } from 'vitest';

import { createPasswordHash, loginAdmin, readAdminSession, verifyPassword } from './admin-auth';

describe('Next admin auth helpers', () => {
  test('verifies existing scrypt password hashes', () => {
    const hash = createPasswordHash('secret', '0123456789abcdef');

    expect(hash).toMatch(/^scrypt:16384:8:1:/);
    expect(verifyPassword('secret', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  test('creates an API-compatible admin session token after login', () => {
    const hash = createPasswordHash('secret', '0123456789abcdef');
    const env = {
      ADMIN_EMAIL: 'owner@example.com',
      ADMIN_PASSWORD_HASH: hash,
      SESSION_SECRET: 'test-session-secret',
    };
    const result = loginAdmin(
      {
        account: ' owner@example.com ',
        password: 'secret',
      },
      env,
      Date.parse('2026-06-14T08:00:00.000Z'),
    );

    expect(result).toMatchObject({
      email: 'owner@example.com',
      expiresAt: '2026-06-14T16:00:00.000Z',
      maxAgeSeconds: 28800,
    });
    expect(readAdminSession(result?.token, env, Date.parse('2026-06-14T09:00:00.000Z'))).toEqual({
      email: 'owner@example.com',
      expiresAt: '2026-06-14T16:00:00.000Z',
    });
  });

  test('rejects invalid admin login attempts', () => {
    const env = {
      ADMIN_EMAIL: 'owner@example.com',
      ADMIN_PASSWORD_HASH: createPasswordHash('secret', '0123456789abcdef'),
      SESSION_SECRET: 'test-session-secret',
    };

    expect(loginAdmin({ account: 'other@example.com', password: 'secret' }, env)).toBeNull();
    expect(loginAdmin({ account: 'owner@example.com', password: 'wrong' }, env)).toBeNull();
  });
});
