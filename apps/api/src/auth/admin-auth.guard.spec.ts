import type { ExecutionContext } from '@nestjs/common';
import { SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { AdminAuthGuard } from './admin-auth.guard';
import { AuthService } from './auth.service';
import { createPasswordHash } from './password';

function createContext(headers: Record<string, string | undefined>, request: Record<string, unknown> = {}): ExecutionContext {
  request.headers = headers;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('AdminAuthGuard', () => {
  const authService = new AuthService({
    adminEmail: 'owner@example.com',
    adminPasswordHash: createPasswordHash('secret-password', 'guard-test-salt'),
    sessionSecret: 'guard-secret',
  });

  test('declares auth service injection explicitly for runtime bootstrap', () => {
    expect(Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, AdminAuthGuard)).toEqual([
      { index: 0, param: AuthService },
    ]);
  });

  test('allows bearer session tokens', async () => {
    const session = await authService.login({ email: 'owner@example.com', password: 'secret-password' });
    const guard = new AdminAuthGuard(authService);

    expect(guard.canActivate(createContext({ authorization: `Bearer ${session.token}` }))).toBe(true);
  });

  test('allows cookie session tokens', async () => {
    const session = await authService.login({ email: 'owner@example.com', password: 'secret-password' });
    const guard = new AdminAuthGuard(authService);

    expect(guard.canActivate(createContext({ cookie: `other=value; ss_session=${session.token}` }))).toBe(true);
  });

  test('attaches the verified admin session to the request', async () => {
    const session = await authService.login({ email: 'owner@example.com', password: 'secret-password' });
    const guard = new AdminAuthGuard(authService);
    const request: Record<string, unknown> = {};

    expect(guard.canActivate(createContext({ authorization: `Bearer ${session.token}` }, request))).toBe(true);
    expect(request.adminSession).toEqual({
      email: 'owner@example.com',
      expiresAt: session.expiresAt,
    });
  });

  test('rejects missing or invalid tokens', () => {
    const guard = new AdminAuthGuard(authService);

    expect(() => guard.canActivate(createContext({}))).toThrow('Admin session is required');
    expect(() => guard.canActivate(createContext({ authorization: 'Bearer invalid' }))).toThrow(
      'Admin session is required',
    );
  });
});
