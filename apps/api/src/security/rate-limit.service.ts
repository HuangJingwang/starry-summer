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

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  consume(key: string, rule: RateLimitRule): RateLimitResult {
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
