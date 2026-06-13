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
        ownerName: 'Aster.H',
      },
    });
  });

  test('keeps the public owner alias fixed while preserving admin settings', async () => {
    await service.updateSettings({
      profile: {
        ownerName: 'Private Owner',
      },
    });

    await expect(service.getSettings()).resolves.toMatchObject({
      profile: {
        ownerName: 'Private Owner',
      },
    });
    await expect(service.getPublicSettings()).resolves.toMatchObject({
      profile: {
        ownerName: 'Aster.H',
      },
    });
  });

  test('trims profile updates before saving', async () => {
    const updated = await service.updateSettings({
      profile: {
        title: '  My Blog  ',
        ownerName: '  Aster.H  ',
        description: '  Notes and daily writing.  ',
        socialLinks: [
          { label: ' GitHub ', href: ' https://github.com/aster-h ' },
          { label: 'Empty', href: '   ' },
        ],
      },
    });

    expect(updated.profile).toEqual({
      title: 'My Blog',
      ownerName: 'Aster.H',
      description: 'Notes and daily writing.',
      socialLinks: [{ label: 'GitHub', href: 'https://github.com/aster-h' }],
    });
  });

  test('trims hero settings before saving', async () => {
    const updated = await service.updateSettings({
      hero: {
        tagline: '  A public trail of private work.  ',
        backgroundImageUrl: '  https://cdn.example.com/hero.jpg  ',
        motto: '  Stay curious, keep shipping.  ',
        quotes: ['  Small notes compound.  ', '', ' Keep a record. '],
      },
    });

    expect(updated.hero).toEqual({
      tagline: 'A public trail of private work.',
      backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
      motto: 'Stay curious, keep shipping.',
      quotes: ['Small notes compound.', 'Keep a record.'],
    });
  });

  test('updates homepage quotes without clearing existing hero fields', async () => {
    await service.updateSettings({
      hero: {
        tagline: 'A public trail of private work.',
        backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
        motto: 'Stay curious, keep shipping.',
        quotes: ['Stay curious, keep shipping.'],
      },
    });

    const updated = await service.updateSettings({
      hero: {
        quotes: ['  Small notes compound.  '],
      },
    });

    expect(updated.hero).toEqual({
      tagline: 'A public trail of private work.',
      backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
      motto: 'Stay curious, keep shipping.',
      quotes: ['Small notes compound.'],
    });
  });
});
