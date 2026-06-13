import { randomBytes } from 'node:crypto';

import { BadRequestException, Body, Controller, Get, Inject, Post, Query, Req, Res, ServiceUnavailableException, UseGuards } from '@nestjs/common';

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
    authorizeUrl.searchParams.set('state', this.authService.createReaderLoginState(state, getSafeReaderRedirectPath(next)));

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
    const readerLoginState = this.authService.verifyReaderLoginState(state);
    const expectedState = readCookieToken(request.headers.cookie, 'ss_oauth_state');

    if (!code || !readerLoginState || readerLoginState.stateToken !== expectedState) {
      throw new BadRequestException('Invalid GitHub login callback');
    }

    const profile = await this.authService.loadGithubReaderProfile(code, buildGithubCallbackUrl(request));
    const session = this.authService.createReaderSession(profile);
    const nextPath = getSafeReaderRedirectPath(decodeURIComponent(readerLoginState.encodedNext));

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
  const configuredCallbackUrl = process.env.GITHUB_CALLBACK_URL?.trim();

  if (configuredCallbackUrl) {
    return normalizeConfiguredGithubCallbackUrl(configuredCallbackUrl);
  }

  const configuredSiteUrl = process.env.PUBLIC_SITE_URL ?? process.env.WEB_ORIGIN;

  if (process.env.NODE_ENV === 'production' && !configuredSiteUrl) {
    throw new ServiceUnavailableException('GITHUB_CALLBACK_URL, PUBLIC_SITE_URL, or WEB_ORIGIN is required for GitHub login in production');
  }

  const siteUrl = (configuredSiteUrl ?? firstHeaderValue(request.headers.origin) ?? 'http://localhost:3000').replace(/\/+$/, '');

  return `${siteUrl}/api/auth/github/callback`;
}

function normalizeConfiguredGithubCallbackUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new ServiceUnavailableException('GITHUB_CALLBACK_URL must be a valid URL');
  }

  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new ServiceUnavailableException('GITHUB_CALLBACK_URL must be an https URL in production');
  }

  if (url.pathname.replace(/\/+$/, '') !== '/api/auth/github/callback') {
    throw new ServiceUnavailableException('GITHUB_CALLBACK_URL must end with /api/auth/github/callback');
  }

  if (url.search || url.hash) {
    throw new ServiceUnavailableException('GITHUB_CALLBACK_URL must not include query parameters or a hash');
  }

  const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    try {
      const siteUrl = new URL(configuredSiteUrl);

      if (url.origin !== siteUrl.origin) {
        throw new ServiceUnavailableException('GITHUB_CALLBACK_URL origin must match PUBLIC_SITE_URL');
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException('PUBLIC_SITE_URL must be a valid URL when GITHUB_CALLBACK_URL is configured');
    }
  }

  return url.toString().replace(/\/+$/, '');
}

function getSafeReaderRedirectPath(value: string | undefined): string {
  if (!value) {
    return '/guestbook';
  }

  try {
    const url = new URL(value, 'http://localhost');

    if (url.origin !== 'http://localhost' || !isAllowedReaderRedirectPath(url.pathname)) {
      return '/guestbook';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/guestbook';
  }
}

function isAllowedReaderRedirectPath(pathname: string): boolean {
  return (
    pathname === '/guestbook' ||
    pathname.startsWith('/posts/') ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/projects/')
  );
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
