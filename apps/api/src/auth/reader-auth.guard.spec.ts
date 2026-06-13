import type { ExecutionContext } from '@nestjs/common';
import { SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { AuthService } from './auth.service';
import { createPasswordHash } from './password';
import { ReaderAuthGuard } from './reader-auth.guard';

function createContext(
  headers: Record<string, string | undefined>,
  request: Record<string, unknown> = {},
): ExecutionContext {
  request.headers = headers;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe('ReaderAuthGuard', () => {
  const authService = new AuthService({
    adminEmail: 'owner@example.com',
    adminPasswordHash: createPasswordHash('secret-password', 'guard-test-salt'),
    sessionSecret: 'reader-guard-secret',
  });

  test('declares auth service injection explicitly for runtime bootstrap', () => {
    expect(Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, ReaderAuthGuard)).toEqual([
      { index: 0, param: AuthService },
    ]);
  });

  test('allows signed reader cookies and attaches the reader session', () => {
    const reader = authService.createReaderSession({
      providerId: '123',
      login: 'reader',
      displayName: 'Reader',
      profileUrl: 'https://github.com/reader',
    });
    const request: Record<string, unknown> = { method: 'POST' };
    const guard = new ReaderAuthGuard(authService);

    expect(guard.canActivate(createContext({
      cookie: `ss_reader=${reader.token}`,
      origin: 'http://localhost:3000',
    }, request))).toBe(true);
    expect(request.readerSession).toMatchObject({
      provider: 'github',
      login: 'reader',
      displayName: 'Reader',
    });
  });

  test('rejects missing reader cookies', () => {
    const guard = new ReaderAuthGuard(authService);

    expect(() => guard.canActivate(createContext({}))).toThrow(
      'GitHub login is required to comment or leave a guestbook message',
    );
  });

  test('requires an allowed origin for unsafe reader cookie submissions', () => {
    const reader = authService.createReaderSession({
      providerId: '123',
      login: 'reader',
      displayName: 'Reader',
      profileUrl: 'https://github.com/reader',
    });
    const guard = new ReaderAuthGuard(authService);
    const previousWebOrigin = process.env.WEB_ORIGIN;

    process.env.WEB_ORIGIN = 'https://blog.example.com';

    try {
      expect(() =>
        guard.canActivate(
          createContext(
            {
              cookie: `ss_reader=${reader.token}`,
            },
            { method: 'POST' },
          ),
        ),
      ).toThrow('Reader request origin is not allowed');
      expect(() =>
        guard.canActivate(
          createContext(
            {
              cookie: `ss_reader=${reader.token}`,
              origin: 'https://evil.example.com',
            },
            { method: 'POST' },
          ),
        ),
      ).toThrow('Reader request origin is not allowed');
      expect(
        guard.canActivate(
          createContext(
            {
              cookie: `ss_reader=${reader.token}`,
              origin: 'https://blog.example.com',
            },
            { method: 'POST' },
          ),
        ),
      ).toBe(true);
    } finally {
      restoreEnv('WEB_ORIGIN', previousWebOrigin);
    }
  });

  test('requires an explicit allowed origin for production reader submissions', () => {
    const reader = authService.createReaderSession({
      providerId: '123',
      login: 'reader',
      displayName: 'Reader',
      profileUrl: 'https://github.com/reader',
    });
    const guard = new ReaderAuthGuard(authService);
    const previousNodeEnv = process.env.NODE_ENV;
    const previousWebOrigin = process.env.WEB_ORIGIN;
    const previousPublicSiteUrl = process.env.PUBLIC_SITE_URL;

    process.env.NODE_ENV = 'production';
    delete process.env.WEB_ORIGIN;
    delete process.env.PUBLIC_SITE_URL;

    try {
      expect(() =>
        guard.canActivate(
          createContext(
            {
              cookie: `ss_reader=${reader.token}`,
              origin: 'http://localhost:3000',
            },
            { method: 'POST' },
          ),
        ),
      ).toThrow('Reader request origin is not configured for production');
    } finally {
      restoreEnv('NODE_ENV', previousNodeEnv);
      restoreEnv('WEB_ORIGIN', previousWebOrigin);
      restoreEnv('PUBLIC_SITE_URL', previousPublicSiteUrl);
    }
  });
});
