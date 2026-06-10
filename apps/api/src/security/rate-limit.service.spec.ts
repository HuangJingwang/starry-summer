import { describe, expect, test } from 'vitest';

import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  test('allows requests within the configured limit', () => {
    const limiter = new RateLimitService(() => 1_000);

    expect(limiter.consume('comments:actor-1', { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(limiter.consume('comments:actor-1', { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
  });

  test('rejects requests beyond the configured limit', () => {
    const limiter = new RateLimitService(() => 1_000);

    limiter.consume('guestbook:actor-1', { limit: 1, windowMs: 60_000 });

    expect(limiter.consume('guestbook:actor-1', { limit: 1, windowMs: 60_000 })).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterMs: 60_000,
    });
  });

  test('resets the counter after the window expires', () => {
    let now = 1_000;
    const limiter = new RateLimitService(() => now);

    limiter.consume('likes:actor-1', { limit: 1, windowMs: 100 });
    now = 1_101;

    expect(limiter.consume('likes:actor-1', { limit: 1, windowMs: 100 }).allowed).toBe(true);
  });
});
