import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readRule(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`(?:^|\\n)${escapedSelector} \\{([\\s\\S]*?)\\n\\}`, 'm'));

  return match?.[1] ?? '';
}

function readLastRule(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...source.matchAll(new RegExp(`(?:^|\\n)${escapedSelector} \\{([\\s\\S]*?)\\n\\}`, 'gm'))];

  return matches.at(-1)?.[1] ?? '';
}

function readRuleContainingSelector(source: string, selectorFragment: string) {
  const matches = [...source.matchAll(/(?:^|\n)(?<selector>[^{]+)\s\{(?<body>[\s\S]*?)\n\}/gm)];
  const match = matches.find((item) => (item.groups?.selector ?? '').includes(selectorFragment));

  return match?.groups?.body ?? '';
}

describe('home page', () => {
  test('renders the README screenshot portfolio hero instead of the immersive landing', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('className="portfolio-home"');
    expect(source).not.toContain('data-scroll-locked="true"');
    expect(source).toContain('className="portfolio-hero"');
    expect(source).toContain('className="portfolio-hero__content cyber-home__container"');
    expect(source).not.toContain('className="home-content-flow cyber-home__container"');
    expect(source).toContain('<h1 className="portfolio-hero__name">{profile.ownerName}</h1>');
    expect(source).toContain('技术写作 / 笔记 / 推荐分享');
    expect(source).toContain('WRITING');
    expect(source).toContain('<p className="portfolio-hero__role">Technical Notes & Summer Moments</p>');
    expect(source).toContain('写技术文章，也记录一些生活里的光。');
    expect(source).not.toContain('PORTFOLIO');
    expect(source).not.toContain('Content Builder');
    expect(source).toContain('className="portfolio-hero__visual"');
    expect(source).toContain('className="portfolio-hero__portrait"');
    expect(source).not.toContain('className="portfolio-hero__status-card"');
    expect(source).not.toContain('aria-label="最近状态"');
    expect(source).toContain('<HomeCardNav />');
    expect(source).toContain('className="portfolio-hero__left-stack"');
    expect(source).toContain('className="portfolio-hero__center-stack"');
    expect(source).toContain('className="portfolio-hero__intro-card"');
    expect(source).toContain('className="portfolio-hero__latest-card"');
    expect(source).not.toContain('className="portfolio-hero__pulse-card"');
    expect(source).toContain('className="portfolio-hero__sky-card"');
    expect(source).toContain('className="portfolio-hero__clock-card"');
    expect(source).toContain('className="portfolio-hero__calendar-card"');
    expect(source).not.toContain('className="portfolio-hero__recommend-card"');
    expect(source).not.toContain('ARCHIVE PULSE');
    expect(source).toContain('LOCAL TIME');
    expect(source).not.toContain('RECOMMEND');
    expect(source).not.toContain('formatNumber(stats.publicCount)');
    expect(source).not.toContain('formatNumber(stats.totalViews)');
    expect(source).not.toContain('formatShortHomeDate(stats.lastPublishedAt)');
    expect(source).toContain('formatHomeClock(homeNow)');
    expect(source).toContain('buildHomeCalendarDays(homeNow)');
    expect(source).toContain("const homeCalendarWeekdays = ['一', '二', '三', '四', '五', '六', '日'];");
    expect(source).toContain('homeCalendarWeekdays.map((weekday)');
    expect(source).toContain('className="portfolio-hero__calendar-weekday"');
    expect(source).toContain("data-empty={day.empty ? 'true' : undefined}");
    expect(source).toContain('function getHomeDateParts');
    expect(source).toContain('getContentHref(latestArticle)');
    expect(source).toContain('getContentCover(latestArticle)');
    expect(source).toContain('formatHomeDate(latestArticle.publishedAt)');
    expect(source).not.toContain('<figcaption>');
    expect(source).toContain('className="portfolio-hero__signal"');
    expect(source).toContain('className="portfolio-hero__night-avatar"');
    expect(source).toContain('src="/images/aster-profile.png"');
    expect(source).toContain('alt="Aster.H 的夜晚头像"');
    expect(source).toContain('className="portfolio-hero__day-avatar"');
    expect(source).toContain('src="/images/aster-day-profile-v2.png"');
    expect(source).toContain('alt="Aster.H 的夏日头像"');
    expect(source).toContain("import { HomeCardNav } from '@/components/HomeCardNav';");
    expect(source).not.toContain("import { MobileBackToTop } from '@/components/MobileBackToTop';");
    expect(source).toContain("import { getContentHref } from '@/lib/content';");
    expect(source).toContain("import { getContentCover } from '@/lib/content-cover';");
    expect(source).not.toContain('className="summer-detail-field summer-detail-field--dashboard"');
    expect(source).not.toContain('className="summer-detail-field summer-detail-field--featured"');
    expect(source).not.toContain('className="summer-detail-field summer-detail-field--popular"');
    expect(source).not.toContain('<HomeScrollGate');
    expect(source).not.toContain('<MobileBackToTop />');
    expect(source).not.toContain("import { HomeScrollGate }");
    expect(source).not.toContain("import { ContentCard }");
    expect(source).not.toContain('function HomeTeaserLink');
    expect(source).toContain('aria-hidden="true"');
    expect(source).not.toContain('className="home-landing"');
    expect(source).not.toContain('className="home-overview"');
    expect(source).not.toContain("DEFAULT_HOME_BACKGROUND_IMAGE_URL = '/images/starry-summer-night.png'");
  });

  test('uses the home profile latest article instead of the pinned-first public list order', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('const latestArticle = profile.latestArticle;');
    expect(source).not.toContain("getPublicContent(content, 'article').slice(0, 1)");
    expect(source).not.toContain('const articleHighlights');
  });

  test('keeps the README screenshot hero actions visible in the first viewport without the stats card', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).not.toContain('className="portfolio-hero__info-panel"');
    expect(source).not.toContain('aria-label="站点概览与快捷入口"');
    expect(source).not.toContain('className="portfolio-hero__stats"');
    expect(source).not.toContain('aria-label="内容资产"');
    expect(source).not.toContain('aria-label="累计浏览"');
    expect(source).not.toContain('aria-label="最近更新"');
    expect(source).not.toContain('portfolio-hero__stat-icon--content');
    expect(source).not.toContain('portfolio-hero__stat-icon--views');
    expect(source).not.toContain('portfolio-hero__stat-icon--updated');
    expect(source).toContain("import { FileText, Heart } from 'lucide-react';");
    expect(source).toContain("import { HomeContactButton } from '@/components/HomeContactButton';");
    expect(source).toContain('className="portfolio-hero__actions"');
    expect(source).toContain('className="portfolio-hero__action-row portfolio-hero__action-row--primary"');
    expect(source).toContain('className="portfolio-hero__action-row portfolio-hero__action-row--secondary"');
    expect(source).toContain('className="portfolio-hero__social portfolio-hero__social--github"');
    expect(source).toContain('className="portfolio-hero__social portfolio-hero__social--juejin"');
    expect(source).toContain('className="portfolio-hero__social portfolio-hero__social--guestbook"');
    expect(source).toContain('<HomeContactButton');
    expect(source).toContain('</HomeContactButton>');
    expect(source).toContain('className="portfolio-hero__like-row"');
    expect(source).toContain('className="portfolio-hero__like-card"');
    expect(source).toContain('formatNumber(stats.totalLikes)');
    expect(source).toContain('<Heart size={28} fill="currentColor" strokeWidth={0} aria-hidden="true" />');
    expect(source).toContain('<div className="portfolio-hero__actions"');
    expect(source).toContain('href="https://github.com/HuangJingwang"');
    expect(source).toContain('href="https://juejin.cn/user/959206842703773"');
    expect(source).toContain('href="/guestbook"');
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noreferrer"');
    expect(source).toContain('<span>Github</span>');
    expect(source).toContain('src="/images/reference-social/github.svg"');
    expect(source).toContain('src="/images/reference-social/juejin.svg"');
    expect(source).toContain('<span>稀土掘金</span>');
    expect(source).toContain('<EmailIcon />');
    expect(source).toContain('function EmailIcon()');
    expect(source).toContain('viewBox="0 0 32 32"');
    expect(source).toContain('fill="var(--color-brand)"');
    expect(source).toContain('fill="var(--color-border)"');
    expect(source).toContain('M1.81799 11.0067V20.7854');
    expect(source).toContain('M28.4446 7.95602');
    expect(source).not.toContain('href="https://github.com/Aster-H"');
    expect(source).not.toContain('className="portfolio-hero__primary"');
    expect(source).not.toContain('className="portfolio-hero__secondary"');
    expect(source).not.toContain('阅读技术文章');
    expect(source).not.toContain('浏览笔记');
    expect(source).not.toContain('查看归档');
    expect(source).toContain('<GitHubIcon />');
    expect(source).toContain('<JuejinIcon />');
  });

  test('uses a tapped contact button before navigating to the guestbook', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/HomeContactButton.tsx'), 'utf8');

    expect(source).toContain("'use client';");
    expect(source).toContain("import { useRouter } from 'next/navigation';");
    expect(source).toContain("data-clicked={clicked ? 'true' : undefined}");
    expect(source).toContain('event.preventDefault();');
    expect(source).toContain('setClicked(true);');
    expect(source).toContain('window.setTimeout(() => {');
    expect(source).toContain('router.push(href);');
    expect(source).toContain('}, 220);');
    expect(source).toContain('event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0');
  });

  test('keeps the home page as a single-screen gateway to independent modules', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');
    const navSource = readFileSync(join(process.cwd(), 'src/components/HomeCardNav.tsx'), 'utf8');

    expect(source).not.toContain('href="/posts"');
    expect(source).not.toContain('href="/posts?type=note"');
    expect(navSource).toContain("href: '/posts'");
    expect(navSource).toContain("label: '近期文章'");
    expect(navSource).toContain("icon: '/images/reference-nav/scroll-outline.svg'");
    expect(navSource).toContain("iconActive: '/images/reference-nav/scroll-filled.svg'");
    expect(navSource).toContain("href: '/projects'");
    expect(navSource).toContain("label: '我的项目'");
    expect(navSource).toContain("href: '/about'");
    expect(navSource).toContain("label: '关于网站'");
    expect(navSource).toContain("href: '/moments'");
    expect(navSource).toContain("label: '推荐分享'");
    expect(navSource).toContain("href: '/leetcode'");
    expect(navSource).toContain("label: '刷题日记'");
    expect(navSource).toContain("icon: '/images/reference-nav/leetcode-outline.svg'");
    expect(navSource).toContain("iconActive: '/images/reference-nav/leetcode-filled.svg'");
    expect(navSource).not.toContain("href: '/about#links'");
    expect(navSource).not.toContain("label: '优秀博客'");
    expect(navSource).not.toContain("href: '/posts?type=note'");
    expect(navSource).not.toContain("label: '技术笔记'");
    expect(navSource).not.toContain("label: '日常片段'");
    expect(source).not.toContain('href="/archives"');
    expect(source).not.toContain('href="/search"');
    expect(source).not.toContain('className="home-content-flow cyber-home__container"');
    expect(source).not.toContain('id="writing"');
    expect(source).not.toContain('id="moments"');
    expect(source).not.toContain('id="projects"');
    expect(source).not.toContain('最近写下的文章');
    expect(source).not.toContain('最近的日常片段');
    expect(source).not.toContain('正在整理的项目');
    expect(source).not.toContain('id="archive"');
    expect(source).not.toContain('时间线入口');
  });

  test('does not render the old desktop workspace image as the home background', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).not.toContain("import { HomeHeroBackground } from '@/components/HomeHeroBackground';");
    expect(source).not.toContain('loadPublicAssets({ usage:');
    expect(source).not.toContain('<HomeHeroBackground');
    expect(source).not.toContain('heroBackgrounds');
    expect(source).not.toContain('/hero-workspace.png');
  });

  test('uses home cards instead of the shared top navigation on the home page', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');
    const shellSource = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');
    const navSource = readFileSync(join(process.cwd(), 'src/components/HomeCardNav.tsx'), 'utf8');

    expect(source).toContain('<SiteShell hideHeader>');
    expect(source).not.toContain('className="cyber-home"');
    expect(source).toContain('<HomeCardNav />');
    expect(navSource).toContain('aria-label="主页导航"');
    expect(navSource).toContain('<div className="portfolio-hero__nav-card">');
    expect(navSource).toContain('className="portfolio-hero__nav-avatar portfolio-hero__nav-avatar--night"');
    expect(navSource).toContain('src="/images/aster-profile.png"');
    expect(navSource).toContain('className="portfolio-hero__nav-avatar portfolio-hero__nav-avatar--day"');
    expect(navSource).toContain('src="/images/aster-day-profile-v2.png"');
    expect(navSource).toContain("href: '/posts'");
    expect(navSource).toContain("label: '近期文章'");
    expect(navSource).toContain("icon: '/images/reference-nav/scroll-outline.svg'");
    expect(navSource).toContain("iconActive: '/images/reference-nav/scroll-filled.svg'");
    expect(navSource).toContain("href: '/projects'");
    expect(navSource).toContain("label: '我的项目'");
    expect(navSource).toContain("icon: '/images/reference-nav/projects-outline.svg'");
    expect(navSource).toContain("href: '/about'");
    expect(navSource).toContain("label: '关于网站'");
    expect(navSource).toContain("icon: '/images/reference-nav/about-outline.svg'");
    expect(navSource).toContain("href: '/moments'");
    expect(navSource).toContain("label: '推荐分享'");
    expect(navSource).toContain("icon: '/images/reference-nav/share-outline.svg'");
    expect(navSource).toContain("href: '/leetcode'");
    expect(navSource).toContain("label: '刷题日记'");
    expect(navSource).toContain("icon: '/images/reference-nav/leetcode-outline.svg'");
    expect(navSource).toContain("iconActive: '/images/reference-nav/leetcode-filled.svg'");
    expect(navSource).not.toContain("href: '/about#links'");
    expect(navSource).not.toContain("label: '优秀博客'");
    expect(navSource).not.toContain("icon: '/images/reference-nav/website-outline.svg'");
    expect(navSource).not.toContain("href: '/posts?type=note'");
    expect(navSource).not.toContain("label: '技术笔记'");
    expect(navSource).not.toContain("label: '日常片段'");
    expect(navSource).not.toContain("href: '#writing'");
    expect(navSource).not.toContain("href: '#projects'");
    expect(navSource).not.toContain("href: '#about'");
    expect(navSource).not.toContain("href: '#moments'");
    expect(navSource).not.toContain("label: '归档'");
    expect(navSource).not.toContain("label: '搜索'");
    expect(navSource).toContain("const transitionStorageKey = 'starry-summer-home-nav-transition';");
    expect(navSource).toContain("const sessionThemeKey = 'starry-summer-theme';");
    expect(navSource).toContain("const [theme, setTheme] = useState<SiteTheme>('summer-night');");
    expect(navSource).toContain('window.sessionStorage.getItem(sessionThemeKey)');
    expect(navSource).toContain('document.documentElement.dataset.theme = nextTheme;');
    expect(navSource).toContain('setTheme(nextTheme);');
    expect(navSource).toContain('function toggleTheme()');
    expect(navSource).toContain('window.sessionStorage.setItem(sessionThemeKey, nextTheme);');
    expect(navSource).toContain('className="portfolio-hero__nav-footer"');
    expect(navSource).toContain('className="portfolio-hero__nav-theme"');
    expect(navSource).toContain('onClick={toggleTheme}');
    expect(navSource).toContain('className="portfolio-hero__nav-brand" href="/"');
    expect(navSource).not.toContain('className="portfolio-hero__nav-brand" href="/#top"');
    expect(navSource).toContain('function getThemeForTime');
    expect(navSource).toContain("data-transitioning={pendingHref ? 'true' : undefined}");
    expect(navSource).toContain('function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string)');
    expect(navSource).toContain('data-home-nav-link="true"');
    expect(navSource).toContain("window.sessionStorage.setItem(transitionStorageKey, href);");
    expect(navSource).toContain('onClick={(event) => handleNavClick(event, item.href)}');
    expect(navSource).not.toContain("import { useRouter } from 'next/navigation';");
    expect(navSource).not.toContain('event.preventDefault();');
    expect(navSource).not.toContain('router.push(href)');
    expect(navSource).not.toContain('window.setTimeout(() => router.push(href), 520)');
    expect(navSource).not.toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
    expect(navSource).not.toContain('<ThemeToggle />');
    expect(navSource).toContain('<small>(开发中)</small>');
    expect(navSource).toContain('<p className="portfolio-hero__nav-kicker">General</p>');
    expect(navSource).toContain('data-active="writing"');
    expect(navSource).toContain("const isActive = pendingHref === item.href || (!pendingHref && index === 0);");
    expect(navSource).toContain("data-active={isActive ? 'true' : undefined}");
    expect(navSource).not.toContain('setActiveKey(key)');
    expect(shellSource).toContain('<PublicCardNav title={settings.profile.title} navItems={navItems} />');
    expect(shellSource).toContain("import { PublicCardNav } from '@/components/PublicCardNav';");
    expect(shellSource).toContain('hideHeader = false');
    expect(shellSource).toContain('hideHeader ? null : <PublicCardNav');
  });

  test('animates the public navigation when arriving from the home card navigation', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/PublicCardNav.tsx'), 'utf8');

    expect(source).toContain("const transitionStorageKey = 'starry-summer-home-nav-transition';");
    expect(source).toContain('const [arrivedFromHome, setArrivedFromHome] = useState(false);');
    expect(source).toContain('window.sessionStorage.getItem(transitionStorageKey)');
    expect(source).toContain('window.sessionStorage.removeItem(transitionStorageKey);');
    expect(source).toContain("site-nav-card--from-home");
    expect(source).toContain('window.setTimeout(() => setArrivedFromHome(false), 680)');
  });

  test('keeps the owner admin entry out of the public top navigation', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).not.toContain('className="admin-link"');
    expect(source).not.toContain('href="/admin"');
  });

  test('renders the shared module navigation as a reference-style icon capsule', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/PublicCardNav.tsx'), 'utf8');
    const orderedHrefs = ["href: '/posts'", "href: '/projects'", "href: '/about'", "href: '/moments'", "href: '/leetcode'"];

    expect(source).toContain('className="brand-avatar brand-avatar--night"');
    expect(source).toContain('className="brand-avatar brand-avatar--day"');
    expect(source).toContain('src="/images/aster-profile.png"');
    expect(source).toContain('src="/images/aster-day-profile-v2.png"');
    expect(source).toContain('const referenceNavItems = [');
    expect(source).toContain("outline: '/images/reference-nav/scroll-outline.svg'");
    expect(source).toContain("filled: '/images/reference-nav/scroll-filled.svg'");
    expect(source).toContain("href: '/moments'");
    expect(source).toContain("label: '推荐分享'");
    expect(source).toContain("outline: '/images/reference-nav/share-outline.svg'");
    expect(source).toContain("filled: '/images/reference-nav/share-filled.svg'");
    expect(source).toContain("href: '/leetcode'");
    expect(source).toContain("label: '刷题日记'");
    expect(source).toContain("outline: '/images/reference-nav/leetcode-outline.svg'");
    expect(source).toContain("filled: '/images/reference-nav/leetcode-filled.svg'");
    expect(source).not.toContain("href: '/about#links'");
    expect(source).not.toContain("label: '优秀博客'");
    expect(source).toContain("outline: '/images/reference-nav/projects-outline.svg'");
    expect(source).toContain("filled: '/images/reference-nav/projects-filled.svg'");
    expect(source).toContain("outline: '/images/reference-nav/about-outline.svg'");
    expect(source).not.toContain("outline: '/images/reference-nav/website-outline.svg'");
    expect(source).toContain('data-active-index={activeIndex}');
    expect(source).toContain('data-hover-index={hoveredIndex}');
    expect(source).toContain("'--active-index': activeIndex");
    expect(source).toContain("'--hover-index': hoveredIndex");
    orderedHrefs.reduce((previousIndex, href) => {
      const nextIndex = source.indexOf(href);

      expect(nextIndex).toBeGreaterThan(previousIndex);

      return nextIndex;
    }, -1);
    expect(source).toContain("'--nav-count': referenceNavItems.length");
    expect(source).toContain('<span className="site-nav__hover" aria-hidden="true" />');
    expect(source).toContain('onFocusCapture={updateHoveredIndex}');
    expect(source).toContain('onMouseOver={updateHoveredIndex}');
    expect(source).toContain('onMouseLeave={() => setHoveredIndex(activeIndex)}');
    expect(source).toContain('data-nav-index={index}');
    expect(source).toContain('className="site-nav__label"');
    expect(source).toContain("import { ThemeToggle } from '@/components/ThemeToggle';");
    expect(source).toContain('className="site-nav-card__tools"');
    expect(source).toContain('<ThemeToggle />');
    expect(source).not.toContain('className="site-search"');
    expect(source).not.toContain('action="/search"');
  });

  test('uses the shared navigation brand as a clean home route', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/PublicCardNav.tsx'), 'utf8');

    expect(source).toContain('href="/"');
    expect(source).not.toContain('href="/#top"');
    expect(source).not.toContain("label: '首页'");
  });

  test('does not render the old home page scroll gate', () => {
    const pageSource = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(pageSource).not.toContain('data-scroll-locked');
    expect(pageSource).not.toContain('HomeScrollGate');
    expect(pageSource).not.toContain('portfolio-hero__scroll');
    expect(pageSource).not.toContain('进入下方内容');
    expect(pageSource).not.toContain('home-dashboard');
    expect(pageSource).not.toContain('content-empty-card');
  });

  test('recognizes home as the readable top hash while keeping top hash compatibility', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/HomeScrollGate.tsx'), 'utf8');

    expect(source).toContain('a[href="#home"], a[href="/#home"], a[href="#top"], a[href="/#top"]');
    expect(source).toContain("window.location.hash === '#home' || window.location.hash === '#top'");
  });

  test('provides a clean /home route as an alias for the root home page', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/home/page.tsx'), 'utf8');

    expect(source).toContain("import { redirect } from 'next/navigation';");
    expect(source).toContain("redirect('/');");
  });

  test('renders a reference-style mobile scroll-to-top control', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/MobileBackToTop.tsx'), 'utf8');
    const iconSource = readFileSync(join(process.cwd(), 'public/images/reference-nav/back-to-top.svg'), 'utf8');

    expect(source).toContain("'use client';");
    expect(source).toContain('aria-label="回到顶部"');
    expect(source).toContain('className="mobile-back-to-top"');
    expect(source).toContain('className="mobile-back-to-top__icon"');
    expect(source).toContain("data-visible={isVisible ? 'true' : undefined}");
    expect(source).toContain('window.scrollY > 160');
    expect(source).toContain("window.addEventListener('scroll', updateVisibility");
    expect(source).toContain("window.removeEventListener('scroll', updateVisibility");
    expect(source).toContain("window.scrollTo({ top: 0, behavior: 'smooth' });");
    expect(source).not.toContain('lucide-react');
    expect(source).not.toContain('ArrowUp');
    expect(iconSource).toContain('viewBox="0 0 28 28"');
    expect(iconSource).toContain('currentColor');
    expect(source).not.toContain('HomeScrollGate');
    expect(source).not.toContain('portfolio-hero__scroll');
  });

  test('keeps home card geometry consistent across day and night themes', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/styles.css'), 'utf8');

    expect(readLastRule(css, '.portfolio-hero__nav-card')).toContain('border-color: #ffffff;');
    expect(readRuleContainingSelector(css, ":root[data-theme='summer-day'] .portfolio-hero__latest-card")).toContain('border-radius: 32px;');
    expect(readRuleContainingSelector(css, ":root[data-theme='summer-day'] .portfolio-hero__intro-card")).toContain('border-radius: 32px;');
    expect(readRule(css, '.portfolio-hero__intro-card')).toContain('min-height: 365px;');
    expect(readRule(css, '.portfolio-hero__visual')).toContain('width: min(100%, 156px);');
    expect(readRule(css, '.portfolio-hero__portrait')).toContain('border-radius: 32px;');
    expect(readRule(css, '.portfolio-hero__portrait')).toContain('padding: 9px;');
    expect(readRule(css, '.portfolio-hero__sky-card,\n.portfolio-hero__clock-card,\n.portfolio-hero__calendar-card')).toContain(
      'border-color: #ffffff;',
    );
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('border-radius: 40px;');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('gap: 0;');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('min-height: 288px;');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('padding: 24px;');
    expect(readRule(css, '.portfolio-hero__calendar-card ol')).toContain('height: 206px;');
    expect(readRule(css, '.portfolio-hero__calendar-card li')).toContain('aspect-ratio: auto;');
    expect(readRule(css, ".portfolio-hero__calendar-card li[data-current='true']")).toContain('border: 1px solid #ffffff;');
    expect(readRule(css, '.portfolio-hero__like-card')).toContain('border-radius: 999px;');
    expect(readRule(css, '.portfolio-hero__like-card')).toContain('height: 48px;');
    expect(readRule(css, '.portfolio-hero__like-card')).toContain('width: 48px;');
  });
});
