import { describe, expect, test } from 'vitest';

import {
  buildSettingsSelect,
  buildSettingsUpsert,
  mapSettingsRows,
  type SettingRow,
} from './postgres-settings.repository';

describe('PostgresSettingsRepository', () => {
  test('maps settings rows to the site settings model', () => {
    const rows: SettingRow[] = [
      {
        key: 'profile',
        value: {
          title: 'Starry Summer',
          ownerName: 'Owner',
          description: 'A personal content platform.',
          socialLinks: [{ label: 'GitHub', href: 'https://github.com/owner' }],
        },
        updated_at: new Date('2026-06-10T00:00:00.000Z'),
      },
      {
        key: 'hero',
        value: {
          tagline: 'A public trail of private work.',
          backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
          motto: 'Stay curious, keep shipping.',
          quotes: ['Stay curious, keep shipping.', 'Small notes compound.'],
        },
        updated_at: new Date('2026-06-10T02:00:00.000Z'),
      },
      {
        key: 'navigation',
        value: ['posts', 'notes'],
        updated_at: new Date('2026-06-10T01:00:00.000Z'),
      },
    ];

    expect(mapSettingsRows(rows)).toEqual({
      profile: {
        title: 'Starry Summer',
        ownerName: 'Owner',
        description: 'A personal content platform.',
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/owner' }],
      },
      hero: {
        tagline: 'A public trail of private work.',
        backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
        motto: 'Stay curious, keep shipping.',
        quotes: ['Stay curious, keep shipping.', 'Small notes compound.'],
      },
      navigation: ['posts', 'notes'],
      updatedAt: '2026-06-10T02:00:00.000Z',
    });
  });

  test('fills default social links for legacy profile settings', () => {
    expect(
      mapSettingsRows([
        {
          key: 'profile',
          value: {
            title: 'Starry Summer',
            ownerName: 'Owner',
            description: 'A personal content platform.',
          },
          updated_at: new Date('2026-06-10T00:00:00.000Z'),
        },
      ]).profile,
    ).toEqual({
      title: 'Starry Summer',
      ownerName: 'Owner',
      description: 'A personal content platform.',
      socialLinks: [],
    });
  });

  test('fills the default motto for legacy hero settings', () => {
    expect(
      mapSettingsRows([
        {
          key: 'hero',
          value: {
            tagline: 'A public trail of private work.',
            backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
          },
          updated_at: new Date('2026-06-10T02:00:00.000Z'),
        },
      ]).hero,
    ).toEqual({
      tagline: 'A public trail of private work.',
      backgroundImageUrl: 'https://cdn.example.com/hero.jpg',
      motto: 'Stay curious. Keep building.',
      quotes: [
        '用代码解决问题，用文字留下路径。',
        '把每一次实践沉淀成未来可以复用的认知。',
      ],
    });
  });

  test('builds settings select and upsert SQL', () => {
    expect(buildSettingsSelect()).toEqual({
      sql: 'select key, value, updated_at from site_settings where key in ($1, $2, $3)',
      values: ['profile', 'navigation', 'hero'],
    });
    expect(
      buildSettingsUpsert('profile', {
        title: 'My Blog',
        ownerName: 'Owner',
        description: 'Notes',
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/me' }],
      }),
    ).toEqual({
      sql: `
      insert into site_settings (key, value, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `,
      values: [
        'profile',
        JSON.stringify({
          title: 'My Blog',
          ownerName: 'Owner',
          description: 'Notes',
          socialLinks: [{ label: 'GitHub', href: 'https://github.com/me' }],
        }),
      ],
    });
    expect(
      buildSettingsUpsert('hero', {
        tagline: 'A public trail of private work.',
        backgroundImageUrl: '/hero.jpg',
        motto: 'Stay curious, keep shipping.',
        quotes: ['Stay curious, keep shipping.'],
      }).values,
    ).toEqual([
      'hero',
      JSON.stringify({
        tagline: 'A public trail of private work.',
        backgroundImageUrl: '/hero.jpg',
        motto: 'Stay curious, keep shipping.',
        quotes: ['Stay curious, keep shipping.'],
      }),
    ]);
  });
});
