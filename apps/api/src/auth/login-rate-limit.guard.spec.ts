import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, test } from 'vitest';

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
  test('limits repeated login attempts from the same actor', async () => {
    const guard = new LoginRateLimitGuard(new RateLimitService(() => 1_000));
    const context = createHttpContext({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' });

    for (let index = 0; index < 10; index += 1) {
      await expect(guard.canActivate(context)).resolves.toBe(true);
    }

    await expect(guard.canActivate(context)).rejects.toThrow('Login rate limit exceeded');
  });
});
