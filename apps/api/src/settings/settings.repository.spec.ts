import { describe, expect, test } from 'vitest';

import { InMemorySettingsRepository } from './settings.repository';

describe('InMemorySettingsRepository', () => {
  test('returns default site settings', async () => {
    const repository = new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z');

    await expect(repository.get()).resolves.toEqual({
      profile: {
        title: 'Starry Summer',
        ownerName: 'Owner',
        description: 'A personal content platform.',
        socialLinks: [],
      },
      hero: {
        tagline: 'Writing, notes, daily traces, and projects in one long-lived home.',
        backgroundImageUrl: '/hero-workspace.png',
        motto: 'Build a public trail of private work.',
        quotes: [
          'Build a public trail of private work.',
          'Small notes compound into a life you can revisit.',
        ],
      },
      navigation: ['posts', 'notes', 'moments', 'projects', 'series', 'guestbook', 'about'],
      updatedAt: '2026-06-10T00:00:00.000Z',
    });
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
            href: 'https://github.com/hjw',
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
            href: 'https://github.com/hjw',
          },
        ],
      },
      hero: {
        tagline: 'Writing, notes, daily traces, and projects in one long-lived home.',
        backgroundImageUrl: '/hero-workspace.png',
        motto: 'Build a public trail of private work.',
        quotes: [
          'Build a public trail of private work.',
          'Small notes compound into a life you can revisit.',
        ],
      },
      navigation: ['posts', 'notes', 'moments', 'projects', 'series', 'guestbook', 'about'],
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
      navigation: ['posts', 'notes', 'moments', 'projects', 'series', 'guestbook', 'about'],
    });
  });

  test('returns cloned social links', async () => {
    const repository = new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z');

    await repository.update({
      profile: {
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/hjw' }],
      },
    });

    const settings = await repository.get();
    settings.profile.socialLinks.push({ label: 'Broken', href: 'https://example.com' });

    await expect(repository.get()).resolves.toMatchObject({
      profile: {
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/hjw' }],
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
          'Build a public trail of private work.',
          'Small notes compound into a life you can revisit.',
        ],
      },
    });
  });
});
