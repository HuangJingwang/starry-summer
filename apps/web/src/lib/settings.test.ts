import { describe, expect, test } from 'vitest';

import {
  buildGetAdminSettingsRequest,
  buildGetPublicSettingsRequest,
  buildUpdateSettingsRequest,
  loadPublicSettings,
  normalizeSiteSettings,
} from './settings';

describe('settings client helpers', () => {
  test('normalizes site settings responses', () => {
    expect(
      normalizeSiteSettings({
        profile: {
          title: 'My Blog',
          ownerName: 'Owner',
          description: 'Notes',
        },
        navigation: ['posts', 'notes'],
        updatedAt: '2026-06-10T00:00:00.000Z',
      }),
    ).toEqual({
      profile: {
        title: 'My Blog',
        ownerName: 'Owner',
        description: 'Notes',
      },
      navigation: ['posts', 'notes'],
      updatedAt: '2026-06-10T00:00:00.000Z',
    });
  });

  test('builds public and admin settings requests', () => {
    expect(buildGetPublicSettingsRequest()).toEqual({
      url: '/api/settings',
      init: {
        method: 'GET',
        next: {
          revalidate: 60,
        },
      },
    });
    expect(buildGetPublicSettingsRequest({ apiBaseUrl: 'https://api.example.com/' })).toEqual({
      url: 'https://api.example.com/settings',
      init: {
        method: 'GET',
        next: {
          revalidate: 60,
        },
      },
    });
    expect(buildGetAdminSettingsRequest()).toEqual({
      url: '/api/admin/settings',
      init: {
        method: 'GET',
        credentials: 'include',
      },
    });
  });

  test('builds credentialed settings update request', () => {
    expect(
      buildUpdateSettingsRequest({
        profile: {
          title: 'My Blog',
          ownerName: 'Owner',
          description: 'Notes',
        },
      }),
    ).toEqual({
      url: '/api/admin/settings',
      init: {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            title: 'My Blog',
            ownerName: 'Owner',
            description: 'Notes',
          },
        }),
      },
    });
  });

  test('loads public settings from the API with defaults on failure', async () => {
    await expect(
      loadPublicSettings(async () =>
        new Response(
          JSON.stringify({
            profile: {
              title: 'Public Blog',
              ownerName: 'Owner',
              description: 'Public description',
            },
            navigation: ['posts'],
            updatedAt: '2026-06-10T00:00:00.000Z',
          }),
        ),
      ),
    ).resolves.toEqual({
      profile: {
        title: 'Public Blog',
        ownerName: 'Owner',
        description: 'Public description',
      },
      navigation: ['posts'],
      updatedAt: '2026-06-10T00:00:00.000Z',
    });

    await expect(loadPublicSettings(async () => new Response('Unavailable', { status: 503 }))).resolves.toMatchObject({
      profile: {
        title: 'Starry Summer',
      },
    });
  });

  test('falls back when public settings request times out', async () => {
    await expect(
      loadPublicSettings(
        () =>
          new Promise<Response>((resolve) => {
            setTimeout(() => resolve(new Response('{}')), 50);
          }),
        { timeoutMs: 1 },
      ),
    ).resolves.toMatchObject({
      profile: {
        title: 'Starry Summer',
      },
    });
  });
});
