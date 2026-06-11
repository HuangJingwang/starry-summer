import { afterEach, describe, expect, test, vi } from 'vitest';
import { createHmac } from 'node:crypto';

import { AuthService, READER_SESSION_MAX_AGE_MS } from './auth.service';
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

  test('creates and verifies GitHub reader sessions separately from admin sessions', async () => {
    const service = new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'auth-service-salt'),
      sessionSecret: 'test-session-secret',
    });
    const adminSession = await service.login({
      email: 'owner@example.com',
      password: 'secret-password',
    });

    const readerSession = service.createReaderSession({
      providerId: '12345',
      login: 'reader',
      displayName: 'Reader Name',
      avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
      profileUrl: 'https://github.com/reader',
    });

    expect(readerSession).toMatchObject({
      provider: 'github',
      providerId: '12345',
      login: 'reader',
      displayName: 'Reader Name',
      profileUrl: 'https://github.com/reader',
      expiresAt: expect.any(String),
    });
    expect(Date.parse(readerSession.expiresAt)).toBeGreaterThan(Date.now() + READER_SESSION_MAX_AGE_MS - 10_000);
    expect(service.verifyReaderSession(readerSession.token)).toMatchObject({
      provider: 'github',
      providerId: '12345',
      login: 'reader',
      displayName: 'Reader Name',
    });
    expect(service.verifyReaderSession(adminSession.token)).toBeNull();
  });

  test('builds GitHub OAuth authorize URLs from configured credentials', () => {
    const service = new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'auth-service-salt'),
      sessionSecret: 'test-session-secret',
      githubClientId: 'github-client-id',
      githubClientSecret: 'github-client-secret',
    });

    const url = service.buildGithubAuthorizeUrl({
      state: 'state-token',
      redirectUri: 'https://blog.example.com/api/auth/github/callback',
    });

    expect(url.toString()).toBe(
      'https://github.com/login/oauth/authorize?client_id=github-client-id&redirect_uri=https%3A%2F%2Fblog.example.com%2Fapi%2Fauth%2Fgithub%2Fcallback&scope=read%3Auser&state=state-token',
    );
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

  test('rejects placeholder password hashes in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(
      () =>
        new AuthService({
          adminEmail: 'owner@example.com',
          adminPasswordHash: 'replace-with-scrypt-hash',
          sessionSecret: '12345678901234567890123456789012',
        }),
    ).toThrow('ADMIN_PASSWORD_HASH must be configured with a scrypt hash in production');
  });
});
