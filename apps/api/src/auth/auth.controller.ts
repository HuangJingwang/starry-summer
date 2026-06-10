import { Body, Controller, Post, Res } from '@nestjs/common';

import { AuthService, type LoginInput } from './auth.service.js';

interface CookieResponse {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() input: LoginInput, @Res({ passthrough: true }) response: CookieResponse) {
    const session = await this.authService.login(input);

    response.cookie('ss_session', session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(session.expiresAt),
      path: '/',
    });

    return {
      email: session.email,
      expiresAt: session.expiresAt,
    };
  }
}
