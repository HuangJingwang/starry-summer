import { describe, expect, test } from 'vitest';

import { createRateLimitServiceFromEnv, RateLimitService, RedisRateLimitStore } from './rate-limit.service';

describe('RateLimitService', () => {
  test('allows requests within the configured limit', async () => {
    const limiter = new RateLimitService(() => 1_000);

    expect((await limiter.consume('comments:actor-1', { limit: 2, windowMs: 60_000 })).allowed).toBe(true);
    expect((await limiter.consume('comments:actor-1', { limit: 2, windowMs: 60_000 })).allowed).toBe(true);
  });

  test('rejects requests beyond the configured limit', async () => {
    const limiter = new RateLimitService(() => 1_000);

    await limiter.consume('guestbook:actor-1', { limit: 1, windowMs: 60_000 });

    await expect(limiter.consume('guestbook:actor-1', { limit: 1, windowMs: 60_000 })).resolves.toEqual({
      allowed: false,
      remaining: 0,
      retryAfterMs: 60_000,
    });
  });

  test('resets the counter after the window expires', async () => {
    let now = 1_000;
    const limiter = new RateLimitService(() => now);

    await limiter.consume('likes:actor-1', { limit: 1, windowMs: 100 });
    now = 1_101;

    expect((await limiter.consume('likes:actor-1', { limit: 1, windowMs: 100 })).allowed).toBe(true);
  });

  test('can consume limits through a Redis-backed store', async () => {
    const client = new FakeRedisClient();
    const limiter = new RateLimitService(new RedisRateLimitStore(client, 'ss:test:'));

    await expect(limiter.consume('comments:actor-1', { limit: 2, windowMs: 60_000 })).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
      retryAfterMs: 60_000,
    });
    await expect(limiter.consume('comments:actor-1', { limit: 2, windowMs: 60_000 })).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
    await expect(limiter.consume('comments:actor-1', { limit: 2, windowMs: 60_000 })).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterMs: 60_000,
    });
    expect(client.expirations.get('ss:test:comments:actor-1')).toBe(60_000);
  });

  test('creates a Redis-backed service when a Redis URL is configured', async () => {
    const client = new FakeConnectableRedisClient();
    const limiter = await createRateLimitServiceFromEnv({
      redisUrl: 'redis://localhost:6379',
      createRedisClient: () => client,
    });

    await limiter.consume('views:actor-1', { limit: 1, windowMs: 60_000 });
    await expect(limiter.consume('views:actor-1', { limit: 1, windowMs: 60_000 })).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
    });
    expect(client.connected).toBe(true);
  });
});

class FakeRedisClient {
  readonly counts = new Map<string, number>();
  readonly expirations = new Map<string, number>();

  async incr(key: string): Promise<number> {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }

  async pExpire(key: string, windowMs: number): Promise<void> {
    this.expirations.set(key, windowMs);
  }

  async pTTL(key: string): Promise<number> {
    return this.expirations.get(key) ?? -1;
  }
}

class FakeConnectableRedisClient extends FakeRedisClient {
  connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }
}
