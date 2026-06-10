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
      },
      hero: {
        tagline: 'Writing, notes, daily traces, and projects in one long-lived home.',
        backgroundImageUrl: '/hero-workspace.png',
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
      },
    });

    await expect(repository.get()).resolves.toMatchObject({
      profile: {
        title: 'New Title',
        ownerName: 'HJW',
        description: 'A quieter personal archive.',
      },
      hero: {
        tagline: 'Writing, notes, daily traces, and projects in one long-lived home.',
        backgroundImageUrl: '/hero-workspace.png',
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
      },
    });

    await expect(repository.get()).resolves.toMatchObject({
      profile: {
        title: 'Starry Summer',
      },
      hero: {
        tagline: 'A public trail of private work.',
        backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
      },
      navigation: ['posts', 'notes', 'moments', 'projects', 'series', 'guestbook', 'about'],
    });
  });
});
