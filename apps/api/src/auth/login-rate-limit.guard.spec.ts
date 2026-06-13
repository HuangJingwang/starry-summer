import type { ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { LoginRateLimitGuard } from './login-rate-limit.guard';
import { RateLimitService } from '../security/rate-limit.service';

function createHttpContext(headers: Record<string, string | undefined> = {}, ip = '127.0.0.1'): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        ip,
        headers,
      }),
    }),
  } as ExecutionContext;
}

describe('LoginRateLimitGuard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('limits repeated login attempts from the same actor', async () => {
    const guard = new LoginRateLimitGuard(new RateLimitService(() => 1_000));
    const context = createHttpContext({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' });

    for (let index = 0; index < 10; index += 1) {
      await expect(guard.canActivate(context)).resolves.toBe(true);
    }

    await expect(guard.canActivate(context)).rejects.toThrow('Login rate limit exceeded');
  });

  test('does not let spoofed forwarded addresses bypass login limits by default', async () => {
    const guard = new LoginRateLimitGuard(new RateLimitService(() => 1_000));

    for (let index = 0; index < 10; index += 1) {
      await expect(
        guard.canActivate(createHttpContext({ 'x-forwarded-for': `198.51.100.${index}, 203.0.113.10` })),
      ).resolves.toBe(true);
    }

    await expect(
      guard.canActivate(createHttpContext({ 'x-forwarded-for': '198.51.100.250, 203.0.113.10' })),
    ).rejects.toThrow('Login rate limit exceeded');
  });

  test('uses the forwarded client address for login limits when proxy trust is enabled', async () => {
    vi.stubEnv('TRUST_PROXY', 'true');
    const guard = new LoginRateLimitGuard(new RateLimitService(() => 1_000));

    for (let index = 0; index < 10; index += 1) {
      await expect(
        guard.canActivate(createHttpContext({ 'x-forwarded-for': `198.51.100.42, 203.0.113.${index}` })),
      ).resolves.toBe(true);
    }

    await expect(
      guard.canActivate(createHttpContext({ 'x-forwarded-for': '198.51.100.42, 203.0.113.250' })),
    ).rejects.toThrow('Login rate limit exceeded');
  });
});
