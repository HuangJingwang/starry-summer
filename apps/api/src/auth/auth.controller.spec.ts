import { describe, expect, test } from 'vitest';

import { AuthController, type AuthenticatedRequest } from './auth.controller';
import { AuthService } from './auth.service';
import { createPasswordHash } from './password';

function createController() {
  return new AuthController(
    new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'controller-test-salt'),
      sessionSecret: 'controller-secret',
    }),
  );
}

describe('AuthController', () => {
  test('returns the current admin session', () => {
    const controller = createController();

    expect(
      controller.me({
        adminSession: {
          email: 'owner@example.com',
          expiresAt: '2026-06-10T00:00:00.000Z',
        },
      } as AuthenticatedRequest),
    ).toEqual({
      email: 'owner@example.com',
      expiresAt: '2026-06-10T00:00:00.000Z',
    });
  });

  test('clears the admin session cookie on logout', () => {
    const controller = createController();
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const result = controller.logout({
      cookie(name: string, value: string, options: Record<string, unknown>) {
        cookies.push({ name, value, options });
      },
    });

    expect(result).toEqual({ ok: true });
    expect(cookies).toEqual([
      {
        name: 'ss_session',
        value: '',
        options: expect.objectContaining({
          httpOnly: true,
          path: '/',
          maxAge: 0,
        }),
      },
    ]);
  });
});
