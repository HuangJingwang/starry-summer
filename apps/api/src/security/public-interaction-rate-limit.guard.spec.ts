import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, test } from 'vitest';

import { PublicInteractionRateLimitGuard } from './public-interaction-rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

function createHttpContext(path: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        ip: '127.0.0.1',
        route: { path },
        headers: {},
      }),
    }),
  } as ExecutionContext;
}

describe('PublicInteractionRateLimitGuard', () => {
  test('allows view tracking at the same frequency as likes', async () => {
    const guard = new PublicInteractionRateLimitGuard(new RateLimitService(() => 1_000));
    const context = createHttpContext('/views/:targetType/:targetId');

    for (let index = 0; index < 30; index += 1) {
      await expect(guard.canActivate(context)).resolves.toBe(true);
    }

    await expect(guard.canActivate(context)).rejects.toThrow('Rate limit exceeded');
  });
});
