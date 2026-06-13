import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import { resolvePublicClientAddress } from '../security/public-client.js';
import { RateLimitService } from '../security/rate-limit.service.js';

interface HttpRequest {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(@Inject(RateLimitService) private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    const result = await this.rateLimitService.consume(`auth:login:${this.actorKey(request)}`, {
      limit: 10,
      windowMs: 5 * 60_000,
    });

    if (!result.allowed) {
      throw new HttpException(
        `Login rate limit exceeded. Retry after ${result.retryAfterMs}ms.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private actorKey(request: HttpRequest): string {
    return resolvePublicClientAddress(request);
  }
}
