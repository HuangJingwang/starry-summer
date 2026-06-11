import { Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from './admin-auth.guard.js';
import { AuthService, SESSION_MAX_AGE_MS, type LoginInput } from './auth.service.js';
import { LoginRateLimitGuard } from './login-rate-limit.guard.js';

interface CookieResponse {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
}

export interface AuthenticatedRequest {
  adminSession: {
    email: string;
    expiresAt: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LoginRateLimitGuard)
  async login(@Body() input: LoginInput, @Res({ passthrough: true }) response: CookieResponse) {
    const session = await this.authService.login(input);

    response.cookie('ss_session', session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(session.expiresAt),
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    });

    return {
      email: session.email,
      expiresAt: session.expiresAt,
    };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.adminSession;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: CookieResponse) {
    response.cookie('ss_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      maxAge: 0,
      path: '/',
    });

    return { ok: true };
  }
}
