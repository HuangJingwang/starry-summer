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
      ],
    });
  });

  test('renders the shared public card navigation in the shell', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain("import { PublicCardNav } from '@/components/PublicCardNav';");
    expect(source).toContain('<PublicCardNav title={settings.profile.title} navItems={navItems} />');
  });

  test('renders the mobile reference scroll-to-top control from the shared shell', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain("import { MobileBackToTop } from '@/components/MobileBackToTop';");
    expect(source).toContain('<MobileBackToTop />');
  });

  test('uses home as the public top anchor name', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain('<div id="home" className="site-shell">');
    expect(source).not.toContain('id="top"');
  });

  test('does not render a shared explanatory footer on public pages', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).not.toContain('hideFooter');
    expect(source).not.toContain('<SiteFooter');
    expect(source).not.toContain('className="site-footer"');
  });

  test('allows the home page to replace the shared top bar with card navigation', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain('hideHeader = false');
    expect(source).toContain('hideHeader ? null : <PublicCardNav');
  });
});
