import type { ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { PublicInteractionRateLimitGuard } from './public-interaction-rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

function createHttpContext(path: string, headers: Record<string, string | undefined> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        ip: '127.0.0.1',
        route: { path },
        headers,
      }),
    }),
  } as ExecutionContext;
}

describe('PublicInteractionRateLimitGuard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('allows view tracking at the same frequency as likes', async () => {
    const guard = new PublicInteractionRateLimitGuard(new RateLimitService(() => 1_000));
    const context = createHttpContext('/views/:targetType/:targetId');

    for (let index = 0; index < 30; index += 1) {
      await expect(guard.canActivate(context)).resolves.toBe(true);
    }

    await expect(guard.canActivate(context)).rejects.toThrow('Rate limit exceeded');
  });

  test('does not let spoofed forwarded addresses bypass public interaction limits by default', async () => {
    const guard = new PublicInteractionRateLimitGuard(new RateLimitService(() => 1_000));
    const route = '/comments/:targetType/:targetId';

    for (let index = 0; index < 8; index += 1) {
      await expect(
        guard.canActivate(createHttpContext(route, { 'x-forwarded-for': `198.51.100.${index}, 203.0.113.10` })),
      ).resolves.toBe(true);
    }

    await expect(
      guard.canActivate(createHttpContext(route, { 'x-forwarded-for': '198.51.100.250, 203.0.113.10' })),
    ).rejects.toThrow('Rate limit exceeded');
  });

  test('uses the original forwarded client address for public interaction limits when proxy trust is enabled', async () => {
    vi.stubEnv('TRUST_PROXY', 'true');
    const guard = new PublicInteractionRateLimitGuard(new RateLimitService(() => 1_000));
    const route = '/comments/:targetType/:targetId';

    for (let index = 0; index < 8; index += 1) {
      await expect(
        guard.canActivate(createHttpContext(route, { 'x-forwarded-for': `198.51.100.42, 203.0.113.${index}` })),
      ).resolves.toBe(true);
    }

    await expect(
      guard.canActivate(createHttpContext(route, { 'x-forwarded-for': '198.51.100.42, 203.0.113.250' })),
    ).rejects.toThrow('Rate limit exceeded');
  });
});
