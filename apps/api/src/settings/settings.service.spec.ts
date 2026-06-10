import { beforeEach, describe, expect, test } from 'vitest';

import { InMemorySettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    service = new SettingsService(new InMemorySettingsRepository(() => '2026-06-10T00:00:00.000Z'));
  });

  test('reads site settings', async () => {
    await expect(service.getSettings()).resolves.toMatchObject({
      profile: {
        title: 'Starry Summer',
        ownerName: 'Owner',
      },
    });
  });

  test('trims profile updates before saving', async () => {
    const updated = await service.updateSettings({
      profile: {
        title: '  My Blog  ',
        ownerName: '  Huang Jingwang  ',
        description: '  Notes and daily writing.  ',
      },
    });

    expect(updated.profile).toEqual({
      title: 'My Blog',
      ownerName: 'Huang Jingwang',
      description: 'Notes and daily writing.',
    });
  });

  test('trims hero settings before saving', async () => {
    const updated = await service.updateSettings({
      hero: {
        tagline: '  A public trail of private work.  ',
        backgroundImageUrl: '  https://cdn.example.com/hero.jpg  ',
        motto: '  Stay curious, keep shipping.  ',
      },
    });

    expect(updated.hero).toEqual({
      tagline: 'A public trail of private work.',
      backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
      motto: 'Stay curious, keep shipping.',
    });
  });
});
