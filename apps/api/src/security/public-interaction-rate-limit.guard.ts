import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { RateLimitService } from './rate-limit.service.js';

interface HttpRequest {
  ip?: string;
  route?: {
    path?: string;
  };
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class PublicInteractionRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    const actor = this.actorKey(request);
    const route = request.route?.path ?? 'interaction';
    const result = this.rateLimitService.consume(`${route}:${actor}`, {
      limit: route.includes('likes') ? 30 : 8,
      windowMs: 60_000,
    });

    if (!result.allowed) {
      throw new HttpException(
        `Rate limit exceeded. Retry after ${result.retryAfterMs}ms.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private actorKey(request: HttpRequest): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

    return forwarded?.split(',')[0]?.trim() || request.ip || 'unknown';
  }
}
