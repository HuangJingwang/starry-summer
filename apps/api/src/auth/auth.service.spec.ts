import { afterEach, describe, expect, test, vi } from 'vitest';
import { createHmac } from 'node:crypto';

import { AuthService } from './auth.service';
import { createPasswordHash } from './password';

describe('AuthService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('logs in the configured admin and returns a verifiable session', async () => {
    const service = new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'auth-service-salt'),
      sessionSecret: 'test-session-secret',
    });

    const session = await service.login({
      email: 'owner@example.com',
      password: 'secret-password',
    });

    expect(session.email).toBe('owner@example.com');
    expect(service.verifySession(session.token)?.email).toBe('owner@example.com');
  });

  test('rejects unknown email addresses', async () => {
    const service = new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'auth-service-salt'),
      sessionSecret: 'test-session-secret',
    });

    await expect(
      service.login({
        email: 'other@example.com',
        password: 'secret-password',
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  test('rejects wrong passwords', async () => {
    const service = new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'auth-service-salt'),
      sessionSecret: 'test-session-secret',
    });

    await expect(
      service.login({
        email: 'owner@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  test('returns null for malformed signed session payloads', () => {
    const sessionSecret = 'test-session-secret';
    const service = new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'auth-service-salt'),
      sessionSecret,
    });
    const encodedPayload = Buffer.from('not-json', 'utf8').toString('base64url');
    const signature = createHmac('sha256', sessionSecret).update(encodedPayload).digest('base64url');

    expect(service.verifySession(`${encodedPayload}.${signature}`)).toBeNull();
  });

  test('rejects signed sessions for a different admin email', () => {
    const sessionSecret = 'test-session-secret';
    const service = new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'auth-service-salt'),
      sessionSecret,
    });
    const encodedPayload = Buffer.from(
      JSON.stringify({
        email: 'other@example.com',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
      'utf8',
    ).toString('base64url');
    const signature = createHmac('sha256', sessionSecret).update(encodedPayload).digest('base64url');

    expect(service.verifySession(`${encodedPayload}.${signature}`)).toBeNull();
  });

  test('rejects weak session secrets in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(
      () =>
        new AuthService({
          adminEmail: 'owner@example.com',
          adminPasswordHash: createPasswordHash('secret-password', 'auth-service-salt'),
          sessionSecret: 'change-me-before-production',
        }),
    ).toThrow('SESSION_SECRET must be at least 32 characters and not a placeholder in production');
  });
});
