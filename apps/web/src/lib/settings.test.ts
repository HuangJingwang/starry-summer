import { describe, expect, test } from 'vitest';

import {
  buildGetAdminSettingsRequest,
  buildGetPublicSettingsRequest,
  buildSettingsFormKey,
  buildUpdateSettingsRequest,
  formatHeroQuotesText,
  loadPublicSettings,
  normalizeSiteSettings,
  parseHeroQuotesText,
  readSettingsErrorMessage,
} from './settings';

describe('settings client helpers', () => {
  const privateOwnerName = String.fromCharCode(0x9ec4, 0x4eac, 0x671b);
  const defaultProfileDescription =
    '我是 Aster.H，这里是我的个人内容平台。文章、笔记、日常和项目都会长期沉淀在这里，方便公开分享，也方便我回看自己的思考和成长轨迹。';

  test('normalizes site settings responses', () => {
    expect(
      normalizeSiteSettings({
        profile: {
          title: 'My Blog',
          ownerName: 'Private Owner',
          description: 'Notes',
          socialLinks: [
            { label: ' GitHub ', href: ' https://github.com/me ' },
            { label: '', href: 'https://empty-label.example.com' },
          ],
        },
        hero: {
          tagline: 'Keep a public trail of quiet work.',
          backgroundImageUrl: 'https://cdn.example.com/background.jpg',
          motto: 'Stay curious, keep shipping.',
          quotes: [' Stay curious, keep shipping. ', '', 'Small notes compound.'],
        },
        navigation: ['posts', 'notes'],
        updatedAt: '2026-06-10T00:00:00.000Z',
      }),
    ).toEqual({
      profile: {
        title: 'My Blog',
        ownerName: 'Aster.H',
        description: 'Notes',
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/me' }],
      },
      hero: {
        tagline: 'Keep a public trail of quiet work.',
        backgroundImageUrl: 'https://cdn.example.com/background.jpg',
        motto: 'Stay curious, keep shipping.',
        quotes: ['Stay curious, keep shipping.', 'Small notes compound.'],
      },
      navigation: ['posts', 'notes'],
      updatedAt: '2026-06-10T00:00:00.000Z',
    });

    expect(normalizeSiteSettings({}).profile.socialLinks).toEqual([]);
    expect(normalizeSiteSettings({}).profile.ownerName).toBe('Aster.H');
    expect(normalizeSiteSettings({}).profile.description).toBe(defaultProfileDescription);
    expect(normalizeSiteSettings({}).profile.description).not.toContain(privateOwnerName);
    expect(normalizeSiteSettings({}).profile.description).not.toContain('AI Agent');
    expect(normalizeSiteSettings({}).hero).toEqual({
      tagline: '把技术探索、项目实践和日常思考长期沉淀成一个可回看的个人知识系统。',
      backgroundImageUrl: '/hero-workspace.png',
      motto: 'Stay curious. Keep building.',
      quotes: [
        '用代码解决问题，用文字留下路径。',
        '把每一次实践沉淀成未来可以复用的认知。',
      ],
    });
    expect(normalizeSiteSettings({}).navigation).toContain('search');
    expect(normalizeSiteSettings({}).navigation[0]).toBe('search');
    expect(normalizeSiteSettings({}).navigation).not.toContain('series');
    expect(normalizeSiteSettings({}).navigation).not.toContain('guestbook');
    expect(normalizeSiteSettings({}).navigation).not.toContain('about');
  });

  test('uses default settings during server render when no API base URL is configured', async () => {
    await expect(loadPublicSettings()).resolves.toMatchObject({
      profile: {
        ownerName: 'Aster.H',
        description: defaultProfileDescription,
      },
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
          socialLinks: [{ label: 'GitHub', href: 'https://github.com/me' }],
        },
        hero: {
          tagline: 'A personal operating base.',
          backgroundImageUrl: '/cover.jpg',
          motto: 'Stay curious, keep shipping.',
          quotes: ['Stay curious, keep shipping.', 'Small notes compound.'],
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
            socialLinks: [{ label: 'GitHub', href: 'https://github.com/me' }],
          },
          hero: {
            tagline: 'A personal operating base.',
            backgroundImageUrl: '/cover.jpg',
            motto: 'Stay curious, keep shipping.',
            quotes: ['Stay curious, keep shipping.', 'Small notes compound.'],
          },
        }),
      },
    });
  });

  test('reads specific settings API error messages', async () => {
    await expect(
      readSettingsErrorMessage(
        new Response(JSON.stringify({ message: 'Owner name is required' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
        '保存失败。',
      ),
    ).resolves.toBe('Owner name is required');

    await expect(
      readSettingsErrorMessage(
        new Response(JSON.stringify({ message: ['Navigation contains unsupported key'] }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
        '保存失败。',
      ),
    ).resolves.toBe('Navigation contains unsupported key');
  });

  test('falls back to a friendly settings error when response has no readable message', async () => {
    await expect(readSettingsErrorMessage(new Response('', { status: 500 }), '保存失败。')).resolves.toBe('保存失败。');
  });

  test('builds a form key that changes when loaded settings change', () => {
    const fallback = normalizeSiteSettings({});
    const loaded = normalizeSiteSettings({
      profile: {
        title: 'Loaded Blog',
        ownerName: 'Loaded Owner',
        description: 'Loaded description',
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/loaded' }],
      },
      hero: {
        tagline: 'Loaded tagline',
        backgroundImageUrl: '/loaded-cover.jpg',
        motto: 'Loaded motto',
        quotes: ['Loaded motto', 'Loaded quote'],
      },
      navigation: ['posts', 'about'],
      updatedAt: '2026-06-11T00:00:00.000Z',
    });

    expect(buildSettingsFormKey(loaded)).not.toBe(buildSettingsFormKey(fallback));
  });

  test('loads public settings from the API with defaults on failure', async () => {
    await expect(
      loadPublicSettings(async () =>
        new Response(
          JSON.stringify({
            profile: {
              title: 'Public Blog',
              ownerName: 'Private Owner',
              description: 'Public description',
              socialLinks: [{ label: 'GitHub', href: 'https://github.com/public-blog' }],
            },
            hero: {
              tagline: 'A public note to the future.',
              backgroundImageUrl: '/public-cover.jpg',
              motto: 'Small notes compound.',
              quotes: ['Small notes compound.', 'Keep a record.'],
            },
            navigation: ['posts'],
            updatedAt: '2026-06-10T00:00:00.000Z',
          }),
        ),
      ),
    ).resolves.toEqual({
      profile: {
        title: 'Public Blog',
        ownerName: 'Aster.H',
        description: 'Public description',
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/public-blog' }],
      },
      hero: {
        tagline: 'A public note to the future.',
        backgroundImageUrl: '/public-cover.jpg',
        motto: 'Small notes compound.',
        quotes: ['Small notes compound.', 'Keep a record.'],
      },
      navigation: ['posts'],
      updatedAt: '2026-06-10T00:00:00.000Z',
    });

    await expect(loadPublicSettings(async () => new Response('Unavailable', { status: 503 }))).resolves.toMatchObject({
      profile: {
        title: 'Starry Summer',
        ownerName: 'Aster.H',
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

  test('parses and formats homepage quote lists', () => {
    expect(parseHeroQuotesText(' Small notes compound.\n\nKeep a record. ')).toEqual([
      'Small notes compound.',
      'Keep a record.',
    ]);
    expect(formatHeroQuotesText(['Small notes compound.', 'Keep a record.'])).toBe(
      'Small notes compound.\nKeep a record.',
    );
  });
});
