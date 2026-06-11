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

  test('uses a cyber archive home layout inspired by the supplied reference', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('className="cyber-home"');
    expect(source).toContain('className="cyber-firefly-field"');
    expect(source).toContain('className="cyber-hero"');
    expect(source).toContain('className="author-bio-card"');
    expect(source).toContain('className="author-profile-card"');
    expect(source).toContain('夏夜数字档案');
    expect(source).toContain('内容索引');
    expect(source).toContain('className="content-empty-card"');
    expect(source).toContain('内容资产');
  });

  test('keeps the owner admin entry out of the public top navigation', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).not.toContain('className="admin-link"');
    expect(source).not.toContain('href="/admin"');
  });
});
