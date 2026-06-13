import { describe, expect, test } from 'vitest';

import { InMemorySettingsRepository } from './settings.repository';

describe('InMemorySettingsRepository', () => {
  const privateOwnerName = String.fromCharCode(0x9ec4, 0x4eac, 0x671b);

  test('returns default site settings', async () => {
    const repository = new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z');

    await expect(repository.get()).resolves.toEqual({
      profile: {
        title: 'Starry Summer',
        ownerName: 'Aster.H',
        description:
          '我是 Aster.H，这里是我的个人内容平台。文章、笔记、日常和项目都会长期沉淀在这里，方便公开分享，也方便我回看自己的思考和成长轨迹。',
        socialLinks: [],
      },
      hero: {
        tagline: '把技术探索、项目实践和日常思考长期沉淀成一个可回看的个人知识系统。',
        backgroundImageUrl: '',
        motto: 'Stay curious. Keep building.',
        quotes: [
          '用代码解决问题，用文字留下路径。',
          '把每一次实践沉淀成未来可以复用的认知。',
        ],
      },
      navigation: ['search', 'posts', 'moments', 'projects'],
      updatedAt: '2026-06-10T00:00:00.000Z',
    });
  });

  test('does not expose the owner real name in default public settings', async () => {
    const repository = new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z');

    const settings = await repository.get();

    expect(settings.profile.ownerName).toBe('Aster.H');
    expect(settings.profile.description).toContain('个人内容平台');
    expect(settings.profile.description).not.toContain(privateOwnerName);
    expect(settings.profile.description).not.toContain('AI Agent');
  });

  test('updates profile settings without replacing navigation', async () => {
    const repository = new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z');

    await repository.update({
      profile: {
        title: 'New Title',
        ownerName: 'HJW',
        description: 'A quieter personal archive.',
        socialLinks: [
          {
            label: 'GitHub',
            href: 'https://github.com/aster-h',
          },
        ],
      },
    });

    await expect(repository.get()).resolves.toMatchObject({
      profile: {
        title: 'New Title',
        ownerName: 'HJW',
        description: 'A quieter personal archive.',
        socialLinks: [
          {
            label: 'GitHub',
            href: 'https://github.com/aster-h',
          },
        ],
      },
      hero: {
        tagline: '把技术探索、项目实践和日常思考长期沉淀成一个可回看的个人知识系统。',
        backgroundImageUrl: '',
        motto: 'Stay curious. Keep building.',
        quotes: [
          '用代码解决问题，用文字留下路径。',
          '把每一次实践沉淀成未来可以复用的认知。',
        ],
      },
      navigation: ['search', 'posts', 'moments', 'projects'],
    });
  });

  test('updates hero settings without replacing profile or navigation', async () => {
    const repository = new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z');

    await repository.update({
      hero: {
        tagline: 'A public trail of private work.',
        backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
        motto: 'Stay curious, keep shipping.',
        quotes: ['Stay curious, keep shipping.', 'Small notes compound.'],
      },
    });

    await expect(repository.get()).resolves.toMatchObject({
      profile: {
        title: 'Starry Summer',
      },
      hero: {
        tagline: 'A public trail of private work.',
        backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
        motto: 'Stay curious, keep shipping.',
        quotes: ['Stay curious, keep shipping.', 'Small notes compound.'],
      },
      navigation: ['search', 'posts', 'moments', 'projects'],
    });
  });

  test('returns cloned social links', async () => {
    const repository = new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z');

    await repository.update({
      profile: {
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/aster-h' }],
      },
    });

    const settings = await repository.get();
    settings.profile.socialLinks.push({ label: 'Broken', href: 'https://example.com' });

    await expect(repository.get()).resolves.toMatchObject({
      profile: {
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/aster-h' }],
      },
    });
  });

  test('returns cloned homepage quotes', async () => {
    const repository = new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z');

    const settings = await repository.get();
    settings.hero.quotes.push('This should not leak back into the repository.');

    await expect(repository.get()).resolves.toMatchObject({
      hero: {
        quotes: [
          '用代码解决问题，用文字留下路径。',
          '把每一次实践沉淀成未来可以复用的认知。',
        ],
      },
    });
  });
});
