import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service.js';

interface HttpRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  adminSession?: {
    email: string;
    expiresAt: string;
  };
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    const bearerToken = this.readBearerToken(request.headers.authorization);
    const cookieToken = this.readCookieToken(request.headers.cookie);
    const token = bearerToken ?? cookieToken;

    const session = token ? this.authService.verifySession(token) : null;

    if (!session) {
      throw new UnauthorizedException('Admin session is required');
    }

    if (!bearerToken && cookieToken && this.isUnsafeMethod(request.method)) {
      this.assertAllowedOrigin(request.headers.origin);
    }

    request.adminSession = session;

    return true;
  }

  private readBearerToken(value: string | string[] | undefined): string | null {
    const header = Array.isArray(value) ? value[0] : value;

    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    return header.slice('Bearer '.length).trim();
  }

  private readCookieToken(value: string | string[] | undefined): string | null {
    const header = Array.isArray(value) ? value.join(';') : value;

    if (!header) {
      return null;
    }

    for (const part of header.split(';')) {
      const [name, rawValue] = part.trim().split('=');

      if (name === 'ss_session' && rawValue) {
        return rawValue;
      }
    }

    return null;
  }

  private isUnsafeMethod(method: string | undefined): boolean {
    return !['GET', 'HEAD', 'OPTIONS'].includes((method ?? 'GET').toUpperCase());
  }

  private assertAllowedOrigin(value: string | string[] | undefined): void {
    const origin = Array.isArray(value) ? value[0] : value;
    const allowedOrigins = [process.env.WEB_ORIGIN, process.env.PUBLIC_SITE_URL]
      .map((item) => item?.trim().replace(/\/+$/, ''))
      .filter(Boolean);

    if (allowedOrigins.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException('Admin request origin is not configured for production');
      }

      allowedOrigins.push('http://localhost:3000');
    }

    if (!origin || !allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      throw new ForbiddenException('Admin request origin is not allowed');
    }
  }
}
