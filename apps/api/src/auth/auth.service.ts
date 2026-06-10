import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';

import { verifyPassword } from './password.js';

export interface AuthConfig {
  adminEmail: string;
  adminPasswordHash: string;
  sessionSecret: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AdminSession {
  email: string;
  token: string;
  expiresAt: string;
}

interface SessionPayload {
  email: string;
  expiresAt: string;
}

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 8;

@Injectable()
export class AuthService {
  private readonly config: AuthConfig;

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      adminEmail: config?.adminEmail ?? process.env.ADMIN_EMAIL ?? 'owner@example.com',
      adminPasswordHash: config?.adminPasswordHash ?? process.env.ADMIN_PASSWORD_HASH ?? '',
      sessionSecret: config?.sessionSecret ?? process.env.SESSION_SECRET ?? 'development-session-secret',
    };
    assertProductionPasswordHash(this.config.adminPasswordHash);
    assertProductionSessionSecret(this.config.sessionSecret);
  }

  async login(input: LoginInput): Promise<AdminSession> {
    const emailMatches = input.email.trim().toLowerCase() === this.config.adminEmail.trim().toLowerCase();
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

  verifySession(token: string): SessionPayload | null {
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

    let payload: SessionPayload;

    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;
    } catch {
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

  private signPayload(payload: SessionPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

    return `${encodedPayload}.${this.sign(encodedPayload)}`;
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
