import { describe, expect, test } from 'vitest';

import {
  buildRepositorySettingsPublishPayload,
  buildRepositorySettingsPublishRequest,
  buildSettingsFormKey,
  formatHeroQuotesText,
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
      backgroundImageUrl: '',
      motto: 'Stay curious. Keep building.',
      quotes: [
        '用代码解决问题，用文字留下路径。',
        '把每一次实践沉淀成未来可以复用的认知。',
      ],
    });
    expect(normalizeSiteSettings({}).hero.backgroundImageUrl).not.toBe('/hero-workspace.png');
    expect(normalizeSiteSettings({}).navigation).toContain('search');
    expect(normalizeSiteSettings({}).navigation[0]).toBe('search');
    expect(normalizeSiteSettings({}).navigation).not.toContain('series');
    expect(normalizeSiteSettings({}).navigation).not.toContain('guestbook');
    expect(normalizeSiteSettings({}).navigation).not.toContain('about');
  });

  test('ships the canonical public GitHub profile while keeping the owner display alias', async () => {
    const { readFile } = await import('node:fs/promises');

    const source = await readFile(new URL('../../content/site-settings.json', import.meta.url), 'utf8');
    const settings = JSON.parse(source) as { profile: { ownerName: string; socialLinks: Array<{ label: string; href: string }> } };

    expect(settings.profile.ownerName).toBe('Aster.H');
    expect(settings.profile.socialLinks).toContainEqual({
      label: 'GitHub',
      href: 'https://github.com/HuangJingwang',
    });
  });

  test('builds repository settings publish payloads for Git-backed settings', () => {
    const request = buildRepositorySettingsPublishRequest({
      profile: {
        title: 'Repository Site',
        ownerName: 'Private Owner',
        description: 'Repository description',
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/example' }],
      },
      hero: {
        tagline: 'Repository tagline',
        backgroundImageUrl: '',
        motto: 'Repository motto',
        quotes: ['Repository quote'],
      },
      navigation: ['posts', 'projects'],
    });

    expect(request.url).toBe('/api/repository/settings');
    expect(request.init).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
    });
    expect(JSON.parse(String(request.init.body))).toMatchObject({
      settings: {
        profile: {
          title: 'Repository Site',
          ownerName: 'Aster.H',
          description: 'Repository description',
        },
        navigation: ['posts', 'projects'],
      },
      files: [
        {
          path: 'apps/web/content/site-settings.json',
        },
      ],
    });

    const payload = buildRepositorySettingsPublishPayload({ navigation: ['posts'] });
    expect(payload.files[0]?.content).toContain('"navigation": [\n    "posts"\n  ]');
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
