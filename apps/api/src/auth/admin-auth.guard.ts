import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service.js';

interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
  adminSession?: {
    email: string;
    expiresAt: string;
  };
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    const token = this.readBearerToken(request.headers.authorization) ?? this.readCookieToken(request.headers.cookie);

    const session = token ? this.authService.verifySession(token) : null;

    if (!session) {
      throw new UnauthorizedException('Admin session is required');
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
}
