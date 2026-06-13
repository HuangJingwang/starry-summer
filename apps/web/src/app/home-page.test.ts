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
    expect(source).toContain('className="portfolio-hero__signal"');
    expect(source).toContain('className="portfolio-hero__night-avatar"');
    expect(source).toContain('src="/images/aster-profile.png"');
    expect(source).toContain('alt="Aster.H 的夜晚头像"');
    expect(source).toContain('className="portfolio-hero__day-avatar"');
    expect(source).toContain('src="/images/aster-day-profile.png"');
    expect(source).toContain('alt="Aster.H 的夏日头像"');
    expect(source).toContain('className="summer-detail-field summer-detail-field--dashboard"');
    expect(source).toContain('className="summer-detail summer-detail--cola"');
    expect(source).toContain('className="summer-detail summer-detail--lemon"');
    expect(source).toContain('className="summer-detail-field summer-detail-field--featured"');
    expect(source).toContain('className="summer-detail summer-detail--surfboard"');
    expect(source).toContain('className="summer-detail summer-detail--ice"');
    expect(source).toContain('className="summer-detail-field summer-detail-field--popular"');
    expect(source).toContain('className="summer-detail summer-detail--sun-glass"');
    expect(source).toContain('aria-hidden="true"');
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

  test('does not render the old desktop workspace image as the home background', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).not.toContain("import { HomeHeroBackground } from '@/components/HomeHeroBackground';");
    expect(source).not.toContain('loadPublicAssets({ usage:');
    expect(source).not.toContain('<HomeHeroBackground');
    expect(source).not.toContain('heroBackgrounds');
    expect(source).not.toContain('/hero-workspace.png');
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
