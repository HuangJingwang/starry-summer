import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { buildSiteFooterModel } from './site-shell';
import type { SiteSettings } from './settings';

const settings: SiteSettings = {
  profile: {
    title: 'Starry Summer',
    ownerName: 'Aster.H',
    description: 'Writing notes and daily traces.',
    socialLinks: [
      {
        label: 'GitHub',
        href: 'https://github.com/Aster-H',
      },
    ],
  },
  hero: {
    tagline: 'A long-lived home.',
    backgroundImageUrl: '/hero.png',
    motto: 'Keep shipping.',
    quotes: ['Keep shipping.'],
  },
  navigation: ['posts', 'notes'],
  updatedAt: '2026-06-11T00:00:00.000Z',
};

describe('site shell helpers', () => {
  test('builds a public footer model with identity and discovery links', () => {
    expect(buildSiteFooterModel(settings)).toEqual({
      title: 'Starry Summer',
      ownerName: 'Aster.H',
      description: 'Writing notes and daily traces.',
      links: [
        {
          label: 'GitHub',
          href: 'https://github.com/Aster-H',
          external: true,
        },
        {
          label: 'RSS',
          href: '/rss.xml',
          external: false,
        },
      ],
    });
  });

  test('renders the public day night theme toggle in the shared shell', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain("import { ThemeToggle } from '@/components/ThemeToggle';");
    expect(source).toContain('<ThemeToggle />');
  });
});
