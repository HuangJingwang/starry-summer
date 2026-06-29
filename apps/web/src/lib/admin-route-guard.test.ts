import { describe, expect, test } from 'vitest';

import { getAdminRouteAccessDecision } from './admin-route-guard';

describe('admin route guard helpers', () => {
  test('allows admin pages without a session in static-site mode', () => {
    expect(
      getAdminRouteAccessDecision({
        pathname: '/admin/content',
        search: '?status=draft',
        sessionToken: undefined,
        sessionSecret: '',
      }),
    ).toEqual({ action: 'allow' });
  });

  test('redirects the removed login page to the static admin workspace', () => {
    expect(
      getAdminRouteAccessDecision({
        pathname: '/admin/login',
        search: '',
        sessionToken: undefined,
        sessionSecret: '',
      }),
    ).toEqual({
      action: 'redirect',
      destination: '/admin',
    });
  });
});
