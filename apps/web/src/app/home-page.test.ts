import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('home page', () => {
  test('renders the configured owner as the portfolio hero heading', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('<h1>Hi，我是 {profile.ownerName}</h1>');
    expect(source).not.toContain('<h1>Starry Summer</h1>');
  });

  test('uses uploaded background assets for a rotating home hero image pool', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('loadPublicAssets({ usage:');
    expect(source).toContain('<HomeHeroBackground');
    expect(source).toContain('backgrounds={heroBackgrounds}');
  });

  test('uses a portfolio-style about hero inspired by the approved reference', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('className="portfolio-hero"');
    expect(source).toContain('className="portfolio-portrait-card"');
    expect(source).toContain('ABOUT ME');
    expect(source).toContain('NOW BUILDING');
    expect(source).toContain('设计与写作');
    expect(source).toContain('内容资产');
  });
});
