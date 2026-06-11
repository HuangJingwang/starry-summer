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

    expect(guard.canActivate(createContext({ cookie: `ss_reader=${reader.token}` }, request))).toBe(true);
    expect(request.readerSession).toMatchObject({
      provider: 'github',
      login: 'reader',
      displayName: 'Reader',
    });
  });

  test('rejects missing reader cookies', () => {
    const guard = new ReaderAuthGuard(authService);

    expect(() => guard.canActivate(createContext({}))).toThrow(
      'GitHub login is required to leave a guestbook message',
    );
  });
});
