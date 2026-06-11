import { randomBytes } from 'node:crypto';

import { BadRequestException, Body, Controller, Get, Inject, Post, Query, Req, Res, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from './admin-auth.guard.js';
import {
  AuthService,
  READER_SESSION_MAX_AGE_MS,
  SESSION_MAX_AGE_MS,
  type LoginInput,
  type ReaderSessionPayload,
} from './auth.service.js';
import { LoginRateLimitGuard } from './login-rate-limit.guard.js';

interface CookieResponse {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
  redirect?(url: string): void;
}

export interface AuthenticatedRequest {
  adminSession: {
    email: string;
    expiresAt: string;
  };
}

interface CookieRequest {
  headers: Record<string, string | string[] | undefined>;
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

  @Get('reader')
  reader(@Req() request: CookieRequest) {
    const token = readCookieToken(request.headers.cookie, 'ss_reader');
    const session = token ? this.authService.verifyReaderSession(token) : null;

    if (!session) {
      return { authenticated: false };
    }

    return toPublicReaderSession(session);
  }

  @Get('github/login')
  githubLogin(
    @Query('next') next: string | undefined,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const state = randomBytes(24).toString('base64url');
    const redirectUri = buildGithubCallbackUrl(request);
    const authorizeUrl = this.authService.buildGithubAuthorizeUrl({
      state,
      redirectUri,
    });
    authorizeUrl.searchParams.set('state', `${state}.${encodeURIComponent(getSafeReaderRedirectPath(next))}`);

    response.cookie('ss_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 10,
      path: '/',
    });
    response.redirect?.(authorizeUrl.toString());

    return { redirectTo: authorizeUrl.toString() };
  }

  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const [stateToken, encodedNext = ''] = (state ?? '').split('.');
    const expectedState = readCookieToken(request.headers.cookie, 'ss_oauth_state');

    if (!code || !stateToken || stateToken !== expectedState) {
      throw new BadRequestException('Invalid GitHub login callback');
    }

    const profile = await this.authService.loadGithubReaderProfile(code, buildGithubCallbackUrl(request));
    const session = this.authService.createReaderSession(profile);
    const nextPath = getSafeReaderRedirectPath(decodeURIComponent(encodedNext));

    response.cookie('ss_reader', session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(session.expiresAt),
      maxAge: READER_SESSION_MAX_AGE_MS,
      path: '/',
    });
    response.cookie('ss_oauth_state', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      maxAge: 0,
      path: '/',
    });
    response.redirect?.(nextPath);

    return toPublicReaderSession(this.authService.verifyReaderSession(session.token) as ReaderSessionPayload);
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

  @Post('reader/logout')
  readerLogout(@Res({ passthrough: true }) response: CookieResponse) {
    response.cookie('ss_reader', '', {
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

function readCookieToken(value: string | string[] | undefined, cookieName: string): string | null {
  const header = Array.isArray(value) ? value.join(';') : value;

  if (!header) {
    return null;
  }

  for (const part of header.split(';')) {
    const [name, rawValue] = part.trim().split('=');

    if (name === cookieName && rawValue) {
      return rawValue;
    }
  }

  return null;
}

function toPublicReaderSession(session: ReaderSessionPayload) {
  return {
    authenticated: true,
    provider: session.provider,
    login: session.login,
    displayName: session.displayName,
    avatarUrl: session.avatarUrl,
    profileUrl: session.profileUrl,
    expiresAt: session.expiresAt,
  };
}

function buildGithubCallbackUrl(request: CookieRequest): string {
  const siteUrl = (
    process.env.PUBLIC_SITE_URL ??
    process.env.WEB_ORIGIN ??
    firstHeaderValue(request.headers.origin) ??
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  return `${siteUrl}/api/auth/github/callback`;
}

function getSafeReaderRedirectPath(value: string | undefined): string {
  if (!value) {
    return '/guestbook';
  }

  try {
    const url = new URL(value, 'http://localhost');

    if (url.origin !== 'http://localhost' || url.pathname !== '/guestbook') {
      return '/guestbook';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/guestbook';
  }
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
