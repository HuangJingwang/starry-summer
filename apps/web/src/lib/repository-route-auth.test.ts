import { describe, expect, test } from 'vitest';

import { isRepositoryRouteAuthorized } from './repository-route-auth';

describe('repository route authorization', () => {
  test('rejects machine publishing secrets in static-site mode', () => {
    expect(
      isRepositoryRouteAuthorized({
        headers: new Headers({ 'x-repository-publish-secret': 'repo-secret' }),
        env: {},
      }),
    ).toBe(false);
  });

  test('rejects browser session cookies in static-site mode', () => {
    expect(
      isRepositoryRouteAuthorized({
        cookieHeader: 'theme=dark; ss_session=legacy-token',
        now: Date.parse('2026-06-14T08:00:00.000Z'),
        env: {},
      }),
    ).toBe(false);
  });

  test('rejects missing publishing credentials', () => {
    expect(
      isRepositoryRouteAuthorized({
        cookieHeader: '',
        headers: new Headers(),
        env: {},
      }),
    ).toBe(false);
  });
});
