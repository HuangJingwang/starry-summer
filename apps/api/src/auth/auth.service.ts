import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

import { verifyPassword } from './password.js';

export interface AuthConfig {
  adminEmail: string;
  adminPasswordHash: string;
  sessionSecret: string;
  githubClientId?: string;
  githubClientSecret?: string;
}

export interface LoginInput {
  email?: string;
  account?: string;
  password: string;
}

export interface AdminSession {
  email: string;
  token: string;
  expiresAt: string;
}

interface AdminSessionPayload {
  email: string;
  expiresAt: string;
}

export interface ReaderSessionInput {
  providerId: string;
  login: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

export interface ReaderSession {
  provider: 'github';
  providerId: string;
  login: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;
  token: string;
  expiresAt: string;
}

export type ReaderSessionPayload = Omit<ReaderSession, 'token'> & { kind: 'reader' };

export interface ReaderLoginStatePayload {
  stateToken: string;
  encodedNext: string;
}

export interface GithubAuthorizeInput {
  state: string;
  redirectUri: string;
}

interface GithubAccessTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GithubUserResponse {
  id?: number | string;
  login?: string;
  name?: string | null;
  avatar_url?: string;
  html_url?: string;
}

export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 8;
export const READER_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
export const DEFAULT_ADMIN_ACCOUNT = 'owner@example.com';
export const DEFAULT_ADMIN_PASSWORD_HASH = '';

@Injectable()
export class AuthService {
  private readonly config: AuthConfig;

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      adminEmail: config?.adminEmail ?? process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_ACCOUNT,
      adminPasswordHash: config?.adminPasswordHash ?? process.env.ADMIN_PASSWORD_HASH ?? DEFAULT_ADMIN_PASSWORD_HASH,
      sessionSecret: config?.sessionSecret ?? process.env.SESSION_SECRET ?? 'development-session-secret',
      githubClientId: config?.githubClientId ?? process.env.GITHUB_CLIENT_ID,
      githubClientSecret: config?.githubClientSecret ?? process.env.GITHUB_CLIENT_SECRET,
    };
    assertProductionPasswordHash(this.config.adminPasswordHash);
    assertProductionSessionSecret(this.config.sessionSecret);
  }

  async login(input: LoginInput): Promise<AdminSession> {
    const loginAccount = (input.account ?? input.email ?? '').trim().toLowerCase();
    const emailMatches = loginAccount === this.config.adminEmail.trim().toLowerCase();
    const passwordMatches =
      this.config.adminPasswordHash.length > 0 && verifyPassword(input.password, this.config.adminPasswordHash);

    if (!emailMatches || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString();
    const token = this.signPayload({ email: this.config.adminEmail, expiresAt });

    return {
      email: this.config.adminEmail,
      token,
      expiresAt,
    };
  }

  verifySession(token: string): AdminSessionPayload | null {
    const payload = this.verifySignedPayload<AdminSessionPayload>(token);

    if (!payload) {
      return null;
    }

    if (
      !payload.email ||
      payload.email.trim().toLowerCase() !== this.config.adminEmail.trim().toLowerCase() ||
      !payload.expiresAt ||
      Date.parse(payload.expiresAt) <= Date.now()
    ) {
      return null;
    }

    return payload;
  }

  createReaderSession(input: ReaderSessionInput): ReaderSession {
    const login = input.login.trim();
    const displayName = (input.displayName?.trim() || login).slice(0, 80);
    const profileUrl = input.profileUrl?.trim() || `https://github.com/${encodeURIComponent(login)}`;
    const expiresAt = new Date(Date.now() + READER_SESSION_MAX_AGE_MS).toISOString();
    const payload: ReaderSessionPayload = {
      kind: 'reader',
      provider: 'github',
      providerId: input.providerId,
      login,
      displayName,
      avatarUrl: input.avatarUrl,
      profileUrl,
      expiresAt,
    };

    return {
      provider: payload.provider,
      providerId: payload.providerId,
      login: payload.login,
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
      profileUrl: payload.profileUrl,
      token: this.signPayload(payload),
      expiresAt,
    };
  }

  verifyReaderSession(token: string): ReaderSessionPayload | null {
    const payload = this.verifySignedPayload<ReaderSessionPayload>(token);

    if (
      !payload ||
      payload.kind !== 'reader' ||
      payload.provider !== 'github' ||
      !payload.providerId ||
      !payload.login ||
      !payload.displayName ||
      !payload.profileUrl ||
      !payload.expiresAt ||
      Date.parse(payload.expiresAt) <= Date.now()
    ) {
      return null;
    }

    return payload;
  }

  buildGithubAuthorizeUrl(input: GithubAuthorizeInput): URL {
    const clientId = this.config.githubClientId?.trim();

    if (!clientId) {
      throw new ServiceUnavailableException('GitHub login is not configured');
    }

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', input.redirectUri);
    url.searchParams.set('scope', 'read:user');
    url.searchParams.set('state', input.state);

    return url;
  }

  createReaderLoginState(stateToken: string, nextPath: string): string {
    const encodedNext = encodeURIComponent(nextPath);
    const payload = `${stateToken}.${encodedNext}`;

    return `${payload}.${this.sign(payload)}`;
  }

  verifyReaderLoginState(value: string | undefined): ReaderLoginStatePayload | null {
    const state = value ?? '';
    const firstSeparatorIndex = state.indexOf('.');
    const lastSeparatorIndex = state.lastIndexOf('.');

    if (firstSeparatorIndex < 0 || lastSeparatorIndex <= firstSeparatorIndex) {
      return null;
    }

    const stateToken = state.slice(0, firstSeparatorIndex);
    const encodedNext = state.slice(firstSeparatorIndex + 1, lastSeparatorIndex);
    const signature = state.slice(lastSeparatorIndex + 1);
    const payload = `${stateToken}.${encodedNext}`;
    const expectedSignature = this.sign(payload);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (!stateToken || !encodedNext || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return null;
    }

    return { stateToken, encodedNext };
  }

  async loadGithubReaderProfile(
    code: string,
    redirectUri: string,
    fetcher: typeof fetch = fetch,
  ): Promise<ReaderSessionInput> {
    const clientId = this.config.githubClientId?.trim();
    const clientSecret = this.config.githubClientSecret?.trim();

    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException('GitHub login is not configured');
    }

    const tokenResponse = await fetcher('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = (await tokenResponse.json()) as GithubAccessTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new UnauthorizedException(tokenData.error_description || tokenData.error || 'GitHub login failed');
    }

    const userResponse = await fetcher('https://api.github.com/user', {
      method: 'GET',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${tokenData.access_token}`,
        'user-agent': 'starry-summer',
      },
    });
    const userData = (await userResponse.json()) as GithubUserResponse;

    if (!userResponse.ok || !userData.id || !userData.login) {
      throw new UnauthorizedException('GitHub user profile could not be loaded');
    }

    return {
      providerId: String(userData.id),
      login: userData.login,
      displayName: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      profileUrl: userData.html_url || `https://github.com/${userData.login}`,
    };
  }

  private signPayload(payload: AdminSessionPayload | ReaderSessionPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

    return `${encodedPayload}.${this.sign(encodedPayload)}`;
  }

  private verifySignedPayload<T>(token: string): T | null {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = this.sign(encodedPayload);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return null;
    }

    try {
      return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as T;
    } catch {
      return null;
    }
  }

  private sign(value: string): string {
    return createHmac('sha256', this.config.sessionSecret).update(value).digest('base64url');
  }
}

function assertProductionPasswordHash(adminPasswordHash: string): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!adminPasswordHash.startsWith('scrypt:')) {
    throw new Error('ADMIN_PASSWORD_HASH must be configured with a scrypt hash in production');
  }
}

function assertProductionSessionSecret(sessionSecret: string): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (
    sessionSecret.length < 32 ||
    sessionSecret.startsWith('replace-') ||
    sessionSecret.startsWith('change-') ||
    sessionSecret === 'development-session-secret'
  ) {
    throw new Error('SESSION_SECRET must be at least 32 characters and not a placeholder in production');
  }
}
