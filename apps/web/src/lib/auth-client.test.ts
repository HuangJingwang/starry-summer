import { describe, expect, test } from 'vitest';

import { buildAdminLoginRedirectPath, buildLoginRequest, buildLogoutRequest, buildSessionRequest, getSafeAdminRedirectPath, normalizeLoginInput } from './auth-client';

describe('auth client helpers', () => {
  test('normalizes owner login input', () => {
    expect(normalizeLoginInput({ account: ' owner@example.com ', password: ' secret ' })).toEqual({
      account: 'owner@example.com',
      password: ' secret ',
    });
  });

  test('builds a credentialed login request', () => {
    expect(buildLoginRequest({ account: 'owner@example.com', password: 'secret' })).toEqual({
      url: '/api/auth/login',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ account: 'owner@example.com', password: 'secret' }),
      },
    });
  });

  test('builds a credentialed session request', () => {
    expect(buildSessionRequest()).toEqual({
      url: '/api/auth/me',
      init: {
        method: 'GET',
        credentials: 'include',
      },
    });
  });

  test('builds a credentialed logout request', () => {
    expect(buildLogoutRequest()).toEqual({
      url: '/api/auth/logout',
      init: {
        method: 'POST',
        credentials: 'include',
      },
    });
  });

  test('normalizes login redirects to safe admin paths', () => {
    expect(getSafeAdminRedirectPath('/admin/projects?status=published')).toBe('/admin/projects?status=published');
    expect(getSafeAdminRedirectPath('/admin/content/new?type=project')).toBe('/admin/content/new?type=project');
    expect(getSafeAdminRedirectPath('/posts')).toBe('/admin');
    expect(getSafeAdminRedirectPath('https://evil.example/admin')).toBe('/admin');
    expect(getSafeAdminRedirectPath('')).toBe('/admin');
    expect(getSafeAdminRedirectPath(undefined)).toBe('/admin');
  });

  test('builds safe admin login redirect paths', () => {
    expect(buildAdminLoginRedirectPath('/admin/projects?status=published')).toBe('/admin/login?next=%2Fadmin%2Fprojects%3Fstatus%3Dpublished');
    expect(buildAdminLoginRedirectPath('/posts')).toBe('/admin/login?next=%2Fadmin');
    expect(buildAdminLoginRedirectPath('https://evil.example/admin')).toBe('/admin/login?next=%2Fadmin');
  });
});
