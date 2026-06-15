import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

import { loadSiteSettings, readRepositorySettingsFile } from './settings-repository';

describe('repository settings source', () => {
  test('loads normalized site settings from a repository-owned JSON file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'starry-settings-'));
    const settingsFilePath = join(directory, 'site-settings.json');

    writeFileSync(
      settingsFilePath,
      JSON.stringify({
        profile: {
          title: 'Repository Site',
          ownerName: 'Private Owner',
          description: 'Repository settings description',
          socialLinks: [{ label: ' GitHub ', href: ' https://github.com/example ' }],
        },
        hero: {
          tagline: 'Repository tagline',
          backgroundImageUrl: '',
          motto: 'Repository motto',
          quotes: [' Repository quote ', ''],
        },
        navigation: ['posts', 'projects'],
        updatedAt: '2026-06-14T08:00:00.000Z',
      }),
      'utf8',
    );

    expect(readRepositorySettingsFile(settingsFilePath)).toEqual({
      profile: {
        title: 'Repository Site',
        ownerName: 'Aster.H',
        description: 'Repository settings description',
        socialLinks: [{ label: 'GitHub', href: 'https://github.com/example' }],
      },
      hero: {
        tagline: 'Repository tagline',
        backgroundImageUrl: '',
        motto: 'Repository motto',
        quotes: ['Repository quote'],
      },
      navigation: ['posts', 'projects'],
      updatedAt: '2026-06-14T08:00:00.000Z',
    });

    await expect(loadSiteSettings({ settingsFilePath })).resolves.toMatchObject({
      profile: {
        title: 'Repository Site',
        ownerName: 'Aster.H',
      },
    });
  });

  test('falls back to default settings when the repository file is unavailable', async () => {
    await expect(loadSiteSettings({ settingsFilePath: 'missing-site-settings.json' })).resolves.toMatchObject({
      profile: {
        title: 'Starry Summer',
        ownerName: 'Aster.H',
      },
    });
  });

  test('does not keep a public settings API source switch', () => {
    const source = readFileSync(__filename.replace(/\.test\.ts$/, '.ts'), 'utf8');

    expect(source).not.toContain('PUBLIC_SETTINGS_SOURCE');
    expect(source).not.toContain('API_BASE_URL');
    expect(source).not.toContain('loadPublicSettings');
  });
});
