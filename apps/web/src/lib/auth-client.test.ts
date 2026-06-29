import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildAdminLoginRedirectPath, getSafeAdminRedirectPath } from './auth-client';

describe('auth client helpers', () => {
  test('does not ship admin credential API routes in static-site mode', () => {
    const routePaths = [
      'src/app/api/auth/login/route.ts',
      'src/app/api/auth/me/route.ts',
      'src/app/api/auth/logout/route.ts',
    ];

    for (const routePath of routePaths) {
      expect(() => readFileSync(join(process.cwd(), routePath), 'utf8')).toThrow();
    }
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
    expect(buildAdminLoginRedirectPath('/admin/projects?status=published')).toBe('/admin/projects?status=published');
    expect(buildAdminLoginRedirectPath('/posts')).toBe('/admin');
    expect(buildAdminLoginRedirectPath('https://evil.example/admin')).toBe('/admin');
  });
});
