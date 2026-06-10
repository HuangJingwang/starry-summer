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
      navigation: ['posts', 'notes', 'moments', 'projects', 'guestbook', 'about'],
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
      navigation: ['posts', 'notes', 'moments', 'projects', 'guestbook', 'about'],
    });
  });
});
