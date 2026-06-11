import { describe, expect, test } from 'vitest';
import { GUARDS_METADATA, SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';

import { AuthController, type AuthenticatedRequest } from './auth.controller';
import { AuthService, SESSION_MAX_AGE_MS } from './auth.service';
import { createPasswordHash } from './password';
import { LoginRateLimitGuard } from './login-rate-limit.guard';

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
  test('declares auth service injection explicitly for runtime bootstrap', () => {
    expect(Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, AuthController)).toEqual([
      { index: 0, param: AuthService },
    ]);
  });

  test('rate limits login attempts before credential verification', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype.login)).toEqual([
      LoginRateLimitGuard,
    ]);
  });

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

  test('sets a secure bounded admin session cookie on login', async () => {
    const controller = createController();
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const result = await controller.login(
      {
        email: 'owner@example.com',
        password: 'secret-password',
      },
      {
        cookie(name: string, value: string, options: Record<string, unknown>) {
          cookies.push({ name, value, options });
        },
      },
    );

    expect(result).toMatchObject({
      email: 'owner@example.com',
      expiresAt: expect.any(String),
    });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toEqual({
      name: 'ss_session',
      value: expect.stringMatching(/^[^.]+\.[^.]+$/),
      options: expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE_MS,
        expires: expect.any(Date),
      }),
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
