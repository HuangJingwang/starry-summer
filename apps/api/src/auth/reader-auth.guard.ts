import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService, type ReaderSessionPayload } from './auth.service.js';

export interface ReaderAuthenticatedRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  readerSession?: ReaderSessionPayload;
}

@Injectable()
export class ReaderAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ReaderAuthenticatedRequest>();
    const token = this.readCookieToken(request.headers.cookie);
    const session = token ? this.authService.verifyReaderSession(token) : null;

    if (!session) {
      throw new UnauthorizedException('GitHub login is required to leave a guestbook message');
    }

    if (this.isUnsafeMethod(request.method)) {
      this.assertAllowedOrigin(request.headers.origin);
    }

    request.readerSession = session;

    return true;
  }

  private readCookieToken(value: string | string[] | undefined): string | null {
    const header = Array.isArray(value) ? value.join(';') : value;

    if (!header) {
      return null;
    }

    for (const part of header.split(';')) {
      const [name, rawValue] = part.trim().split('=');

      if (name === 'ss_reader' && rawValue) {
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
    const allowedOrigins = [
      process.env.WEB_ORIGIN,
      process.env.PUBLIC_SITE_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]
      .map((item) => item?.trim().replace(/\/+$/, ''))
      .filter(Boolean);

    if (origin && !allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      throw new ForbiddenException('Reader request origin is not allowed');
    }
  }
}
