import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('home page', () => {
  test('renders the README screenshot portfolio hero instead of the immersive landing', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('className="portfolio-home"');
    expect(source).toContain('className="portfolio-hero"');
    expect(source).toContain('className="portfolio-hero__content cyber-home__container"');
    expect(source).toContain('<h1 className="portfolio-hero__name">{profile.ownerName}</h1>');
    expect(source).toContain('<p className="portfolio-hero__role">Content Builder</p>');
    expect(source).toContain('className="portfolio-hero__portrait"');
    expect(source).toContain('/images/aster-profile.png');
    expect(source).toContain('SCROLL TO ENTER');
    expect(source).not.toContain('className="home-landing"');
    expect(source).not.toContain('className="home-overview"');
    expect(source).not.toContain("DEFAULT_HOME_BACKGROUND_IMAGE_URL = '/images/starry-summer-night.png'");
  });

  test('keeps the README screenshot hero actions and statistics visible in the first viewport', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('className="portfolio-hero__stats"');
    expect(source).toContain('<dt>内容资产</dt>');
    expect(source).toContain('<dt>累计浏览</dt>');
    expect(source).toContain('<dt>收到喜欢</dt>');
    expect(source).toContain('<dt>最近更新</dt>');
    expect(source).toContain('className="portfolio-hero__actions"');
    expect(source).toContain('className="portfolio-hero__primary"');
    expect(source).toContain('className="portfolio-hero__secondary"');
    expect(source).toContain('className="portfolio-hero__social"');
    expect(source).toContain('<GitHubIcon />');
    expect(source).toContain('<JuejinIcon />');
  });

  test('uses uploaded background assets for a rotating home hero image pool', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('loadPublicAssets({ usage:');
    expect(source).toContain('<HomeHeroBackground');
    expect(source).toContain('backgrounds={heroBackgrounds}');
  });

  test('keeps the README screenshot public navigation visible on the home page', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');
    const shellSource = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain('<SiteShell>');
    expect(source).not.toContain('className="cyber-home"');
    expect(shellSource).toContain('className="site-header site-nav-card"');
    expect(shellSource).toContain('className="brand site-nav-card__brand"');
    expect(shellSource).toContain('className="site-nav__items"');
  });

  test('keeps the owner admin entry out of the public top navigation', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).not.toContain('className="admin-link"');
    expect(source).not.toContain('href="/admin"');
  });

  test('renders a compact search form in the shared top navigation', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain('className="site-search"');
    expect(source).toContain('action="/search"');
    expect(source).toContain('name="q"');
    expect(source).toContain('aria-label="站内搜索"');
    expect(source).toContain('placeholder="搜索"');
  });

  test('uses the brand as the home and scroll-to-top control', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain('id="top"');
    expect(source).toContain('href="/#top"');
    expect(source).not.toContain("label: '首页'");
  });
});
