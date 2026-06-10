import { Injectable } from '@nestjs/common';

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  consume(key: string, rule: RateLimitRule): Promise<RateLimitResult>;
}

@Injectable()
export class RateLimitService {
  private readonly store: RateLimitStore;

  constructor(nowOrStore: (() => number) | RateLimitStore = () => Date.now()) {
    this.store = typeof nowOrStore === 'function' ? new InMemoryRateLimitStore(nowOrStore) : nowOrStore;
  }

  consume(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
    return this.store.consume(key, rule);
  }
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  async consume(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
    const now = this.now();
    const current = this.buckets.get(key);
    const bucket =
      current && current.resetAt > now
        ? current
        : {
            count: 0,
            resetAt: now + rule.windowMs,
          };

    if (bucket.count >= rule.limit) {
      this.buckets.set(key, bucket);

      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: bucket.resetAt - now,
      };
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);

    return {
      allowed: true,
      remaining: Math.max(rule.limit - bucket.count, 0),
      retryAfterMs: bucket.resetAt - now,
    };
  }
}

export interface RedisRateLimitClient {
  incr(key: string): Promise<number>;
  pExpire(key: string, milliseconds: number): Promise<unknown>;
  pTTL(key: string): Promise<number>;
}

export interface ConnectableRedisRateLimitClient extends RedisRateLimitClient {
  connect(): Promise<unknown>;
  on?(event: 'error', listener: (error: Error) => void): unknown;
}

export interface RateLimitServiceFactoryOptions {
  redisUrl?: string;
  createRedisClient?: (redisUrl: string) => ConnectableRedisRateLimitClient;
}

export class RedisRateLimitStore implements RateLimitStore {
  constructor(
    private readonly client: RedisRateLimitClient,
    private readonly keyPrefix = 'starry-summer:rate-limit:',
  ) {}

  async consume(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
    const redisKey = `${this.keyPrefix}${key}`;
    const count = await this.client.incr(redisKey);

    if (count === 1) {
      await this.client.pExpire(redisKey, rule.windowMs);
    }

    const ttl = await this.client.pTTL(redisKey);
    const retryAfterMs = ttl > 0 ? ttl : rule.windowMs;

    if (count > rule.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(rule.limit - count, 0),
      retryAfterMs,
    };
  }
}

export async function createRateLimitServiceFromEnv(
  options: RateLimitServiceFactoryOptions = {},
): Promise<RateLimitService> {
  const redisUrl = options.redisUrl ?? process.env.REDIS_URL;

  if (!redisUrl) {
    return new RateLimitService();
  }

  const client = options.createRedisClient
    ? options.createRedisClient(redisUrl)
    : await createDefaultRedisClient(redisUrl);

  client.on?.('error', (error) => {
    console.error('Redis rate limit client error', error);
  });
  await client.connect();

  return new RateLimitService(new RedisRateLimitStore(client));
}

async function createDefaultRedisClient(redisUrl: string): Promise<ConnectableRedisRateLimitClient> {
  const { createClient } = await import('redis');
  return createClient({ url: redisUrl }) as unknown as ConnectableRedisRateLimitClient;
}
