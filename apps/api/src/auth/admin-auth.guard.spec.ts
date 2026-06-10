import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, test } from 'vitest';

import { AdminAuthGuard } from './admin-auth.guard';
import { AuthService } from './auth.service';
import { createPasswordHash } from './password';

function createContext(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as ExecutionContext;
}

describe('AdminAuthGuard', () => {
  const authService = new AuthService({
    adminEmail: 'owner@example.com',
    adminPasswordHash: createPasswordHash('secret-password', 'guard-test-salt'),
    sessionSecret: 'guard-secret',
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

  test('rejects missing or invalid tokens', () => {
    const guard = new AdminAuthGuard(authService);

    expect(() => guard.canActivate(createContext({}))).toThrow('Admin session is required');
    expect(() => guard.canActivate(createContext({ authorization: 'Bearer invalid' }))).toThrow(
      'Admin session is required',
    );
  });
});
