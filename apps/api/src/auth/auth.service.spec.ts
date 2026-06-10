import { describe, expect, test } from 'vitest';

import { AuthService } from './auth.service';
import { createPasswordHash } from './password';

describe('AuthService', () => {
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
});
