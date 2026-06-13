import { afterEach, describe, expect, test, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { GUARDS_METADATA, SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';

import { AuthController, type AuthenticatedRequest } from './auth.controller';
import { AuthService, SESSION_MAX_AGE_MS } from './auth.service';
import { createPasswordHash } from './password';
import { LoginRateLimitGuard } from './login-rate-limit.guard';

function createController() {
  return new AuthController(
    new AuthService({
      adminEmail: 'owner@example.com',
      adminPasswordHash: createPasswordHash('secret-password', 'controller-test-salt'),
      sessionSecret: 'controller-secret',
      githubClientId: 'github-client-id',
      githubClientSecret: 'github-client-secret',
    }),
  );
}

function createSignedReaderLoginState(stateToken: string, nextPath: string): string {
  const encodedNext = encodeURIComponent(nextPath);
  const payload = `${stateToken}.${encodedNext}`;

  return `${payload}.${createHmac('sha256', 'controller-secret').update(payload).digest('base64url')}`;
}

function verifySignedReaderLoginState(value: string | undefined) {
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
  const expectedSignature = createHmac('sha256', 'controller-secret').update(payload).digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  return { stateToken, encodedNext };
}

describe('AuthController', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('declares auth service injection explicitly for runtime bootstrap', () => {
    expect(Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, AuthController)).toEqual([
      { index: 0, param: AuthService },
    ]);
  });

  test('rate limits login attempts before credential verification', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype.login)).toEqual([
      LoginRateLimitGuard,
    ]);
  });

  test('returns the current admin session', () => {
    const controller = createController();

    expect(
      controller.me({
        adminSession: {
          email: 'owner@example.com',
          expiresAt: '2026-06-10T00:00:00.000Z',
        },
      } as AuthenticatedRequest),
    ).toEqual({
      email: 'owner@example.com',
      expiresAt: '2026-06-10T00:00:00.000Z',
    });
  });

  test('sets a secure bounded admin session cookie on login', async () => {
    const controller = createController();
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const result = await controller.login(
      {
        email: 'owner@example.com',
        password: 'secret-password',
      },
      {
        cookie(name: string, value: string, options: Record<string, unknown>) {
          cookies.push({ name, value, options });
        },
      },
    );

    expect(result).toMatchObject({
      email: 'owner@example.com',
      expiresAt: expect.any(String),
    });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toEqual({
      name: 'ss_session',
      value: expect.stringMatching(/^[^.]+\.[^.]+$/),
      options: expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE_MS,
        expires: expect.any(Date),
      }),
    });
  });

  test('clears the admin session cookie on logout', () => {
    const controller = createController();
    const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const result = controller.logout({
      cookie(name: string, value: string, options: Record<string, unknown>) {
        cookies.push({ name, value, options });
      },
    });

    expect(result).toEqual({ ok: true });
    expect(cookies).toEqual([
      {
        name: 'ss_session',
        value: '',
        options: expect.objectContaining({
          httpOnly: true,
          path: '/',
          maxAge: 0,
        }),
      },
    ]);
  });

  test('allows reader login to return to public content pages only', () => {
    const controller = createController();

    const postLogin = controller.githubLogin('/posts/hello-world?from=comment#comments', { headers: {} }, {
      cookie() {},
    });
    const adminLogin = controller.githubLogin('/admin/content', { headers: {} }, {
      cookie() {},
    });
    const externalLogin = controller.githubLogin('https://evil.example/phish', { headers: {} }, {
      cookie() {},
    });

    expect(decodeURIComponent(new URL(postLogin.redirectTo).searchParams.get('state') ?? '')).toContain(
      '/posts/hello-world?from=comment#comments',
    );
    expect(decodeURIComponent(new URL(adminLogin.redirectTo).searchParams.get('state') ?? '')).toContain('/guestbook');
    expect(decodeURIComponent(new URL(externalLogin.redirectTo).searchParams.get('state') ?? '')).toContain('/guestbook');
  });

  test('does not trust request origin for GitHub callback URLs in production', () => {
    const controller = createController();

    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PUBLIC_SITE_URL', undefined);
    vi.stubEnv('WEB_ORIGIN', undefined);

    expect(() =>
      controller.githubLogin('/guestbook', { headers: { origin: 'https://evil.example' } }, {
        cookie() {},
      }),
    ).toThrow('GITHUB_CALLBACK_URL, PUBLIC_SITE_URL, or WEB_ORIGIN is required for GitHub login in production');
  });

  test('uses the configured GitHub callback URL for production reader login', () => {
    const controller = createController();

    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PUBLIC_SITE_URL', undefined);
    vi.stubEnv('WEB_ORIGIN', undefined);
    vi.stubEnv('GITHUB_CALLBACK_URL', 'https://blog.aster.test/api/auth/github/callback');

    const login = controller.githubLogin('/guestbook', { headers: { origin: 'https://evil.example' } }, {
      cookie() {},
    });

    expect(new URL(login.redirectTo).searchParams.get('redirect_uri')).toBe(
      'https://blog.aster.test/api/auth/github/callback',
    );
  });

  test('rejects insecure configured GitHub callback URLs in production', () => {
    const controller = createController();

    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GITHUB_CALLBACK_URL', 'http://blog.aster.test/api/auth/github/callback');

    expect(() =>
      controller.githubLogin('/guestbook', { headers: {} }, {
        cookie() {},
      }),
    ).toThrow('GITHUB_CALLBACK_URL must be an https URL in production');
  });

  test('rejects configured GitHub callback URLs with the wrong callback path', () => {
    const controller = createController();

    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GITHUB_CALLBACK_URL', 'https://blog.aster.test/oauth/callback');

    expect(() =>
      controller.githubLogin('/guestbook', { headers: {} }, {
        cookie() {},
      }),
    ).toThrow('GITHUB_CALLBACK_URL must end with /api/auth/github/callback');
  });

  test('rejects configured GitHub callback URLs that do not match PUBLIC_SITE_URL', () => {
    const controller = createController();

    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PUBLIC_SITE_URL', 'https://blog.aster.test');
    vi.stubEnv('GITHUB_CALLBACK_URL', 'https://other.aster.test/api/auth/github/callback');

    expect(() =>
      controller.githubLogin('/guestbook', { headers: {} }, {
        cookie() {},
      }),
    ).toThrow('GITHUB_CALLBACK_URL origin must match PUBLIC_SITE_URL');
  });

  test('rejects configured GitHub callback URLs with query strings', () => {
    const controller = createController();

    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GITHUB_CALLBACK_URL', 'https://blog.aster.test/api/auth/github/callback?next=/guestbook');

    expect(() =>
      controller.githubLogin('/guestbook', { headers: {} }, {
        cookie() {},
      }),
    ).toThrow('GITHUB_CALLBACK_URL must not include query parameters or a hash');
  });

  test('rejects configured GitHub callback URLs with hash fragments', () => {
    const controller = createController();

    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GITHUB_CALLBACK_URL', 'https://blog.aster.test/api/auth/github/callback#reader');

    expect(() =>
      controller.githubLogin('/guestbook', { headers: {} }, {
        cookie() {},
      }),
    ).toThrow('GITHUB_CALLBACK_URL must not include query parameters or a hash');
  });

  test('keeps dotted public content paths intact in the reader login state', async () => {
    const controller = new AuthController({
      buildGithubAuthorizeUrl(input: Parameters<AuthService['buildGithubAuthorizeUrl']>[0]) {
        const url = new URL('https://github.com/login/oauth/authorize');
        url.searchParams.set('state', input.state);
        return url;
      },
      createReaderLoginState: createSignedReaderLoginState,
      verifyReaderLoginState: verifySignedReaderLoginState,
      async loadGithubReaderProfile() {
        return {
          providerId: '123',
          login: 'ada',
          displayName: 'Ada Lovelace',
          profileUrl: 'https://github.com/ada',
        };
      },
      createReaderSession() {
        return {
          provider: 'github',
          providerId: '123',
          login: 'ada',
          displayName: 'Ada Lovelace',
          profileUrl: 'https://github.com/ada',
          token: 'reader-token',
          expiresAt: '2026-06-12T00:00:00.000Z',
        };
      },
      verifyReaderSession() {
        return {
          kind: 'reader',
          provider: 'github',
          providerId: '123',
          login: 'ada',
          displayName: 'Ada Lovelace',
          profileUrl: 'https://github.com/ada',
          expiresAt: '2026-06-12T00:00:00.000Z',
        };
      },
    } as unknown as AuthService);
    const cookies: Array<{ name: string; value: string }> = [];
    const login = controller.githubLogin('/posts/release-1.2.0#comments', { headers: {} }, {
      cookie(name: string, value: string) {
        cookies.push({ name, value });
      },
    });
    const state = new URL(login.redirectTo).searchParams.get('state') ?? '';
    const redirects: string[] = [];

    await controller.githubCallback('code', state, {
      headers: {
        cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
      },
    }, {
      cookie() {},
      redirect(url: string) {
        redirects.push(url);
      },
    });

    expect(redirects).toEqual(['/posts/release-1.2.0#comments']);
  });

  test('rejects GitHub callback states with tampered reader redirects', async () => {
    const loadGithubReaderProfile = vi.fn();
    const controller = new AuthController({
      buildGithubAuthorizeUrl(input: Parameters<AuthService['buildGithubAuthorizeUrl']>[0]) {
        const url = new URL('https://github.com/login/oauth/authorize');
        url.searchParams.set('state', input.state);
        return url;
      },
      createReaderLoginState: createSignedReaderLoginState,
      verifyReaderLoginState: verifySignedReaderLoginState,
      loadGithubReaderProfile,
      createReaderSession() {
        throw new Error('Reader session should not be created for a tampered OAuth state');
      },
      verifyReaderSession() {
        return null;
      },
    } as unknown as AuthService);
    const cookies: Array<{ name: string; value: string }> = [];
    const login = controller.githubLogin('/guestbook', { headers: {} }, {
      cookie(name: string, value: string) {
        cookies.push({ name, value });
      },
    });
    const state = new URL(login.redirectTo).searchParams.get('state') ?? '';
    const [stateToken, , signature] = state.split('.');
    const tamperedState = `${stateToken}.${encodeURIComponent('/posts/tampered')}.${signature ?? ''}`;

    await expect(controller.githubCallback('code', tamperedState, {
      headers: {
        cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
      },
    }, {
      cookie() {},
      redirect() {},
    })).rejects.toThrow('Invalid GitHub login callback');
    expect(loadGithubReaderProfile).not.toHaveBeenCalled();
  });
});
