import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import {
  createAdminSessionToken,
  resolveAdminSessionSecret,
  verifyAdminSessionToken,
  type AdminSessionPayload,
} from './admin-route-guard';

const sessionMaxAgeMs = 1000 * 60 * 60 * 8;
const keyLength = 64;

export interface AdminAuthEnv {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD_HASH?: string;
  NODE_ENV?: string;
  SESSION_SECRET?: string;
}

export interface AdminLoginInput {
  account?: string;
  email?: string;
  password?: string;
}

export interface AdminLoginResult {
  email: string;
  token: string;
  expiresAt: string;
  maxAgeSeconds: number;
}

export const defaultAdminEmail = 'owner@example.com';

export function createPasswordHash(password: string, salt = randomBytes(16).toString('hex')): string {
  const hash = scryptSync(password, salt, keyLength, {
    N: 16_384,
    r: 8,
    p: 1,
  }).toString('hex');

  return ['scrypt', 16_384, 8, 1, salt, hash].join(':');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, cost, blockSize, parallelization, salt, expected] = storedHash.split(':');

  if (algorithm !== 'scrypt' || !cost || !blockSize || !parallelization || !salt || !expected) {
    return false;
  }

  const actual = scryptSync(password, salt, keyLength, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
  });
  const expectedBuffer = Buffer.from(expected, 'hex');

  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function loginAdmin(input: AdminLoginInput, env: AdminAuthEnv = process.env, now = Date.now()): AdminLoginResult | null {
  const adminEmail = env.ADMIN_EMAIL?.trim() || defaultAdminEmail;
  const passwordHash = env.ADMIN_PASSWORD_HASH?.trim() ?? '';
  const account = (input.account ?? input.email ?? '').trim().toLowerCase();
  const password = input.password ?? '';

  assertProductionAdminPasswordHash(passwordHash, env);

  if (!passwordHash || account !== adminEmail.toLowerCase() || !verifyPassword(password, passwordHash)) {
    return null;
  }

  const expiresAt = new Date(now + sessionMaxAgeMs).toISOString();
  const token = createAdminSessionToken({ email: adminEmail, expiresAt }, resolveAdminSessionSecret(env));

  return {
    email: adminEmail,
    token,
    expiresAt,
    maxAgeSeconds: Math.floor(sessionMaxAgeMs / 1000),
  };
}

export function readAdminSession(token: string | undefined, env: AdminAuthEnv = process.env, now = Date.now()): AdminSessionPayload | null {
  return verifyAdminSessionToken(
    token,
    resolveAdminSessionSecret(env),
    now,
    env.ADMIN_EMAIL,
  );
}

function assertProductionAdminPasswordHash(passwordHash: string, env: AdminAuthEnv): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  if (!passwordHash.startsWith('scrypt:')) {
    throw new Error('ADMIN_PASSWORD_HASH must be configured with a scrypt hash in production');
  }
}
