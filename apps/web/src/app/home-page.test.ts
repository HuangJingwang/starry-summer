import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

const globalStylePaths = [
  'src/app/styles/base.css',
  'src/app/styles/public.css',
  'src/app/styles/home.css',
  'src/app/styles/content.css',
  'src/app/styles/leetcode.css',
  'src/app/styles/share.css',
  'src/app/styles/admin.css',
  'src/app/styles/responsive.css',
];

function readGlobalStyles() {
  return globalStylePaths
    .map((path) => readFileSync(join(process.cwd(), path), 'utf8'))
    .join('\n');
}

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

function readMediaRule(source: string, mediaQuery: string, selector: string) {
  const mediaStart = source.indexOf(`@media ${mediaQuery} {`);

  if (mediaStart === -1) {
    return '';
  }

  let depth = 0;
  let mediaEnd = source.length;
  let started = false;

  for (let index = mediaStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
      started = true;
    }

    if (char === '}') {
      depth -= 1;
    }

    if (started && depth === 0) {
      mediaEnd = index + 1;
      break;
    }
  }

  const mediaBlock = source.slice(mediaStart, mediaEnd).replace(/^[ \t]+/gm, '');

  return readLastRule(mediaBlock, selector);
}

describe('home page', () => {
  test('keeps public module backgrounds persistent while module cards and content change', () => {
    const rootLayoutSource = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    const siteShellSource = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');
    const persistentBackgroundPath = join(process.cwd(), 'src/components/PersistentPublicBackground.tsx');

    expect(existsSync(persistentBackgroundPath)).toBe(true);
    expect(rootLayoutSource).toContain("import { PersistentPublicBackground } from '@/components/PersistentPublicBackground';");
    expect(rootLayoutSource).toContain('<PersistentPublicBackground />');
    expect(siteShellSource).not.toContain("import { StarrySkyCanvas } from '@/components/StarrySkyCanvas';");
    expect(siteShellSource).not.toContain('<StarrySkyCanvas className="site-shell__canvas" showFleet={false} />');
  });

  test('renders the README screenshot portfolio hero instead of the immersive landing', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');
    const introSource = readFileSync(join(process.cwd(), 'src/components/HomeIntroCard.tsx'), 'utf8');
    const greetingSource = readFileSync(join(process.cwd(), 'src/lib/home-greeting.ts'), 'utf8');

    expect(source).toContain('className="portfolio-home"');
    expect(source).not.toContain('data-scroll-locked="true"');
    expect(source).toContain('className="portfolio-hero"');
    expect(source).toContain('className="portfolio-hero__content cyber-home__container"');
    expect(source).not.toContain('className="home-content-flow cyber-home__container"');
    expect(source).toContain("import { HomeIntroCard } from '@/components/HomeIntroCard';");
    expect(source).toContain('<HomeIntroCard ownerName={profile.ownerName} lead={heroLead} />');
    expect(introSource).toContain("'use client';");
    expect(introSource).toContain("import { getHomeGreeting } from '@/lib/home-greeting';");
    expect(greetingSource).toContain('export function getHomeGreeting(date = new Date())');
    expect(greetingSource).toContain("return 'Good Morning';");
    expect(greetingSource).toContain("return 'Good Afternoon';");
    expect(greetingSource).toContain("return 'Good Evening';");
    expect(greetingSource).toContain("return 'Good Night';");
    expect(introSource).toContain('window.setInterval(syncGreeting, 60 * 1000)');
    expect(introSource).toContain('className="portfolio-hero__hi-avatar"');
    expect(introSource).toContain('className="portfolio-hero__hi-avatar-night"');
    expect(introSource).toContain('className="portfolio-hero__hi-avatar-day"');
    expect(introSource).toContain('className="portfolio-hero__hi-line" suppressHydrationWarning');
    expect(introSource).toContain('{greeting}');
    expect(introSource).toContain('I&apos;m <strong className="portfolio-hero__hi-name">{ownerName}</strong>,');
    expect(introSource).toContain('<span className="portfolio-hero__hi-line portfolio-hero__hi-line--meet">nice to meet you!</span>');
    expect(source).toContain('在这里记录技术文章、工程实践和一些生活里的光。');
    expect(source).not.toContain('WRITING');
    expect(source).not.toContain('<p className="portfolio-hero__role">Technical Notes & Summer Moments</p>');
    expect(source).not.toContain('把每一次实践沉淀成未来可以复用的认知。');
    expect(source).not.toContain('PORTFOLIO');
    expect(source).not.toContain('Content Builder');
    expect(source).not.toContain('className="portfolio-hero__visual"');
    expect(source).not.toContain('className="portfolio-hero__portrait"');
    expect(source).not.toContain('className="portfolio-hero__status-card"');
    expect(source).not.toContain('aria-label="最近状态"');
    expect(source).toContain('<HomeCardNav />');
    expect(source).toContain('className="portfolio-hero__left-stack"');
    expect(source).toContain('className="portfolio-hero__center-stack"');
    expect(introSource).toContain('className="portfolio-hero__intro-card"');
    expect(source).toContain('className="portfolio-hero__latest-card"');
    expect(source).not.toContain('className="portfolio-hero__pulse-card"');
    expect(source).toContain('<HomeFleetBackground />');
    expect(source).not.toContain('className="portfolio-hero__fleet-sketch"');
    expect(source).toContain('className="portfolio-hero__sky-card"');
    expect(source).not.toContain('className="portfolio-hero__fleet-card"');
    expect(source).toContain('className="portfolio-hero__calendar-card"');
    expect(source).not.toContain('className="portfolio-hero__recommend-card"');
    expect(source).not.toContain('ARCHIVE PULSE');
    expect(source).toContain('portfolio-hero__sky-image portfolio-hero__sky-image--night');
    expect(source).toContain('src="/images/starry-night-atmosphere.webp"');
    expect(source).toContain('alt="Starry Summer night atmosphere"');
    expect(source).toContain('portfolio-hero__sky-image portfolio-hero__sky-image--day');
    expect(source).toContain('src="/images/yysuni-atmosphere.jpg"');
    expect(source).toContain('alt="YYsuni reference atmosphere"');
    expect(source).not.toContain('/images/starry-summer-night.png');
    expect(source).not.toContain('Daylight notes, open archive.');
    expect(existsSync(join(process.cwd(), 'public/images/starry-night-atmosphere.webp'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public/images/yysuni-atmosphere.jpg'))).toBe(true);
    expect(source).toContain("import { HomeClockCard } from '@/components/HomeClockCard';");
    expect(source).toContain("import { HomeAdminControl } from '@/components/HomeAdminControl';");
    expect(source).toContain('<HomeLeetCodeCard recommendation={recommendedProblem} />\n\n            <HomeAdminControl />\n            <HomeClockCard />');
    expect(source).not.toContain('<div className="portfolio-hero__action-row portfolio-hero__action-row--secondary">\n                  <HomeAdminControl />');
    expect(source).toContain('<HomeClockCard />');
    expect(source).not.toContain('formatHomeClock(homeNow)');
    expect(source).not.toContain('RECOMMEND');
    expect(source).not.toContain('formatNumber(stats.publicCount)');
    expect(source).not.toContain('formatNumber(stats.totalViews)');
    expect(source).not.toContain('formatShortHomeDate(stats.lastPublishedAt)');
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
    expect(source).not.toContain('className="portfolio-hero__signal"');
    expect(source).not.toContain('className="portfolio-hero__night-avatar"');
    expect(source).not.toContain('src="/images/aster-profile.png"');
    expect(source).not.toContain('alt="Aster.H 的夜晚头像"');
    expect(source).not.toContain('className="portfolio-hero__day-avatar"');
    expect(source).not.toContain('src="/images/aster-day-profile-v2.png"');
    expect(source).not.toContain('alt="Aster.H 的夏日头像"');
    expect(source).toContain("import { HomeCardNav } from '@/components/HomeCardNav';");
    expect(source).not.toContain("import { FleetFlagshipCanvas } from '@/components/FleetFlagshipCanvas';");
    expect(source).not.toContain('className="portfolio-hero__fleet-canvas"');
    expect(source).not.toContain('className="portfolio-hero__fleet-card"');
    expect(source).not.toContain('className="portfolio-hero__fleet-ship"');
    expect(source).toContain('<HomeFleetBackground />');
    expect(source).not.toContain('className="portfolio-hero__fleet-sketch"');
    expect(source).toContain("import { HomeFleetBackground } from '@/components/HomeFleetBackground';");
    expect(source).not.toContain("import { MobileBackToTop } from '@/components/MobileBackToTop';");
    expect(source).toContain("import { getContentHref } from '@/lib/content';");
    expect(source).toContain("import { getContentCover } from '@/lib/content-cover';");
    expect(source).toContain('buildHomeLeetCodeRecommendation');
    expect(source).toContain("import { loadRepositoryStudyDashboard } from '@/lib/study-repository';");
    expect(source).toContain('const recommendedProblem = buildHomeLeetCodeRecommendation(studyDashboard);');
    expect(source).toContain('className="portfolio-hero__leetcode-card"');
    expect(source).toContain('aria-label="今日推荐 LeetCode 题目"');
    expect(source).toContain('className="portfolio-hero__leetcode-mark"');
    expect(source).toContain('className="portfolio-hero__leetcode-status"');
    expect(source).toContain('同步刷题数据后，这里会推荐下一题。');
    expect(source).not.toContain('题目描述');
    expect(source).not.toContain('<Braces');
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
    expect(source).toContain("import { FileText, Heart, Mail } from 'lucide-react';");
    expect(source).not.toContain("import { Braces, FileText, Heart, Mail } from 'lucide-react';");
    expect(source).toContain("import { HomeAdminControl } from '@/components/HomeAdminControl';");
    expect(source).toContain("import { HomeContactButton } from '@/components/HomeContactButton';");
    expect(source).toContain('className="portfolio-hero__actions"');
    expect(source).toContain('className="portfolio-hero__action-row portfolio-hero__action-row--primary"');
    expect(source).toContain('className="portfolio-hero__action-row portfolio-hero__action-row--secondary"');
    expect(source).toContain('className="portfolio-hero__social portfolio-hero__social--github"');
    expect(source).toContain('className="portfolio-hero__social portfolio-hero__social--juejin"');
    expect(source).toContain('className="portfolio-hero__social portfolio-hero__social--guestbook"');
    expect(source).toContain('<HomeAdminControl />');
    expect(source).not.toContain('href="/admin" aria-label="进入后台管理"');
    expect(source).not.toContain('<span>管理</span>');
    expect(source).not.toContain('<span>后台</span>');
    expect(source).toContain("const homeGitHubUrl = 'https://github.com/HuangJingwang/starry-summer';");
    expect(source).toContain("const juejinLink = settings.profile.socialLinks.find((link) => link.href.includes('juejin.cn'));");
    expect(source).toContain('<HomeContactButton');
    expect(source).toContain('</HomeContactButton>');
    expect(source).toContain('className="portfolio-hero__like-row"');
    expect(source).toContain('className="portfolio-hero__like-card"');
    expect(source).toContain('formatNumber(stats.totalLikes)');
    expect(source).toContain('<Heart size={28} fill="currentColor" strokeWidth={0} aria-hidden="true" />');
    expect(source).toContain('<div className="portfolio-hero__actions"');
    expect(source).toContain('href={homeGitHubUrl}');
    expect(source).toContain('href={juejinLink.href}');
    expect(source).toContain('href="/guestbook"');
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noreferrer"');
    expect(source).toContain('<span>Github</span>');
    expect(source).toContain('src="/images/reference-social/github.svg"');
    expect(source).toContain('src="/images/reference-social/juejin.svg"');
    expect(source).toContain('<span>稀土掘金</span>');
    expect(source).toContain('<Mail className="portfolio-hero__social-icon portfolio-hero__social-icon--email"');
    expect(source).toContain('strokeWidth={1.8}');
    expect(source).not.toContain('<EmailIcon />');
    expect(source).not.toContain('function EmailIcon()');
    expect(source).not.toContain('viewBox="0 0 32 32"');
    expect(source).not.toContain('M1.81799 11.0067V20.7854');
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
    expect(navSource).toContain('<div ref={navCardRef} className="portfolio-hero__nav-card">');
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
    expect(navSource).toContain('interface HomeNavTransitionPayload');
    expect(navSource).toContain("from '@/lib/site-theme';");
    expect(navSource).toContain('const [returnedFromModule, setReturnedFromModule] = useState(false);');
    expect(navSource).toContain('const [returnStyle, setReturnStyle] = useState<CSSProperties | undefined>();');
    expect(navSource).toContain('const navCardRef = useRef<HTMLDivElement | null>(null);');
    expect(navSource).toContain('readHomeNavTransitionPayload(window.sessionStorage.getItem(transitionStorageKey))');
    expect(navSource).toContain("transitionPayload?.href !== '/'");
    expect(navSource).toContain("'--home-nav-return-scale-x': sourceRect.width / destinationRect.width");
    expect(navSource).toContain("'--home-nav-return-scale-y': sourceRect.height / destinationRect.height");
    expect(navSource).toContain("'--home-nav-return-x': `${sourceRect.left - destinationRect.left}px`");
    expect(navSource).toContain("'--home-nav-return-y': `${sourceRect.top - destinationRect.top}px`");
    expect(navSource).toContain("portfolio-hero__card-nav--from-module");
    expect(navSource).toContain('style={returnStyle}');
    expect(navSource).toContain('<div ref={navCardRef} className="portfolio-hero__nav-card">');
    expect(navSource).toContain("const [theme, setTheme] = useState<SiteTheme>('summer-night');");
    expect(navSource).toContain('window.sessionStorage.getItem(themeStorageKey)');
    expect(navSource).toContain('sessionTheme ?? getThemeCookie() ?? getThemeForTime()');
    expect(navSource).toContain('document.documentElement.dataset.theme = nextTheme;');
    expect(navSource).toContain('setThemeCookie(nextTheme);');
    expect(navSource).toContain('setTheme(nextTheme);');
    expect(navSource).toContain('function toggleTheme()');
    expect(navSource).toContain('window.sessionStorage.setItem(themeStorageKey, nextTheme);');
    expect(navSource).toContain('className="portfolio-hero__nav-footer"');
    expect(navSource).toContain('className="portfolio-hero__nav-theme"');
    expect(navSource).toContain('onClick={toggleTheme}');
    expect(navSource).toContain('className="portfolio-hero__nav-brand" href="/"');
    expect(navSource).not.toContain('className="portfolio-hero__nav-brand" href="/#top"');
    expect(navSource).toContain('getThemeForTime,');
    expect(navSource).toContain("data-transitioning={pendingHref ? 'true' : undefined}");
    expect(navSource).toContain('function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string)');
    expect(navSource).toContain('data-home-nav-link="true"');
    expect(navSource).toContain("event.currentTarget.closest('.portfolio-hero__nav-card')");
    expect(navSource).toContain('navCard instanceof HTMLElement ? navCard.getBoundingClientRect() : null');
    expect(navSource).toContain('JSON.stringify({');
    expect(navSource).toContain('height: rect.height,');
    expect(navSource).toContain('left: rect.left,');
    expect(navSource).toContain('top: rect.top,');
    expect(navSource).toContain('width: rect.width,');
    expect(navSource).toContain('onClick={(event) => handleNavClick(event, item.href)}');
    expect(navSource).not.toContain("import { useRouter } from 'next/navigation';");
    expect(navSource).not.toContain('event.preventDefault();');
    expect(navSource).not.toContain('router.push(href)');
    expect(navSource).not.toContain('window.setTimeout(() => router.push(href), 520)');
    expect(navSource).toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
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
    expect(source).toContain('interface HomeNavTransitionPayload');
    expect(source).toContain('const [arrivalStyle, setArrivalStyle] = useState<CSSProperties | undefined>();');
    expect(source).toContain('const headerRef = useRef<HTMLElement | null>(null);');
    expect(source).toContain('useLayoutEffect(() => {');
    expect(source).toContain('readHomeNavTransitionPayload(window.sessionStorage.getItem(transitionStorageKey))');
    expect(source).toContain('const [arrivedFromHome, setArrivedFromHome] = useState(false);');
    expect(source).toContain('const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {');
    expect(source).toContain("href: '/',");
    expect(source).toContain('headerRef.current?.getBoundingClientRect()');
    expect(source).toContain('onClick={handleBrandClick}');
    expect(source).toContain('function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>)');
    expect(source).toContain('window.sessionStorage.removeItem(transitionStorageKey);');
    expect(source).toContain("'--nav-arrive-scale-x': sourceRect.width / destinationRect.width");
    expect(source).toContain("'--nav-arrive-scale-y': sourceRect.height / destinationRect.height");
    expect(source).toContain("'--nav-arrive-x': `${sourceRect.left - destinationRect.left}px`");
    expect(source).toContain("'--nav-arrive-y': `${sourceRect.top - destinationRect.top}px`");
    expect(source).toContain('style={arrivalStyle}');
    expect(source).toContain("site-nav-card--from-home");
    expect(source).toContain('function readHomeNavTransitionPayload(value: string | null): HomeNavTransitionPayload | null');
    expect(source).toContain('return { href: value };');
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
    expect(source).toContain('hoverRestoreTimeoutRef');
    expect(source).toContain('onBlurCapture={restoreHoveredIndexWhenFocusLeaves}');
    expect(source).toContain('onMouseLeave={scheduleHoveredIndexRestore}');
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

    expect(source).toContain("'use client';");
    expect(source).toContain("import { ArrowUp } from 'lucide-react';");
    expect(source).toContain('aria-label="回到顶部"');
    expect(source).toContain('className="mobile-back-to-top"');
    expect(source).toContain('<ArrowUp size={24} strokeWidth={1.8} aria-hidden="true" />');
    expect(source).toContain("data-visible={isVisible ? 'true' : undefined}");
    expect(source).toContain('window.scrollY > 160');
    expect(source).toContain("window.addEventListener('scroll', updateVisibility");
    expect(source).toContain("window.removeEventListener('scroll', updateVisibility");
    expect(source).toContain("window.scrollTo({ top: 0, behavior: 'smooth' });");
    expect(source).not.toContain('mobile-back-to-top__icon');
    expect(source).not.toContain('HomeScrollGate');
    expect(source).not.toContain('portfolio-hero__scroll');
  });

  test('uses Lucide for simple replaceable home control icons', () => {
    const homeNavSource = readFileSync(join(process.cwd(), 'src/components/HomeCardNav.tsx'), 'utf8');

    expect(homeNavSource).toContain("import { Moon, Sun } from 'lucide-react';");
    expect(homeNavSource).toContain("{theme === 'summer-day' ? <Sun size={18} strokeWidth={1.8} aria-hidden=\"true\" /> : <Moon size={18} strokeWidth={1.8} aria-hidden=\"true\" />}");
    expect(homeNavSource).not.toContain("'☀'");
    expect(homeNavSource).not.toContain("'☾'");
  });

  test('keeps home card geometry consistent across day and night themes', () => {
    const css = readGlobalStyles();
    const normalizedCss = css.replace(/\r\n/g, '\n');

    expect(readRule(css, '.portfolio-hero')).toContain('justify-content: flex-start;');
    expect(readRule(css, '.portfolio-hero .cyber-home__container')).toContain('align-items: stretch;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('display: block;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-center-x: 50%;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-center-y: clamp(420px, 47.5svh, 500px);');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-gap: 36px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-hi-width: 360px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-hi-height: 260px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-art-width: 360px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-art-height: 188px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-clock-width: 232px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-clock-offset: 92px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-portrait-clock-gap: 24px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-calendar-width: 350px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-social-width: 315px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-article-width: 266px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-nav-width: 280px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-nav-height: 398px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('--reference-nav-top: calc(var(--reference-center-y) + var(--reference-hi-height) / 2 - var(--reference-nav-height));');
    expect(readRule(css, '.portfolio-hero__latest-card')).toContain('position: absolute;');
    expect(readRule(css, '.portfolio-hero__intro-card')).toContain('position: absolute;');
    expect(readRule(css, '.portfolio-hero__actions')).toContain('margin-top: 0;');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('position: absolute;');
    expect(readLastRule(css, '.portfolio-hero__nav-card')).toContain('border-color: rgba(148, 163, 184, 0.26);');
    expect(readRuleContainingSelector(css, ":root[data-theme='summer-day'] .portfolio-hero__latest-card")).toContain('border-radius: 32px;');
    expect(readRuleContainingSelector(css, ":root[data-theme='summer-day'] .portfolio-hero__intro-card")).toContain('border-radius: 32px;');
    expect(readRule(css, '.portfolio-hero__content')).toContain('padding: 0;');
    expect(readRule(css, '.portfolio-hero__intro-card')).toContain('left: calc(var(--reference-center-x) - var(--reference-hi-width) / 2);');
    expect(readRule(css, '.portfolio-hero__intro-card')).toContain('top: calc(var(--reference-center-y) - var(--reference-hi-height) / 2);');
    expect(readRule(css, '.portfolio-hero__intro-card')).toContain('height: var(--reference-hi-height);');
    expect(readRule(css, '.portfolio-hero__intro-card')).toContain('width: var(--reference-hi-width);');
    expect(readRule(css, '.portfolio-hero__visual')).toContain('width: var(--reference-portrait-width);');
    expect(readRule(css, '.portfolio-hero__sky-card')).toContain('left: calc(var(--reference-center-x) - var(--reference-art-width) / 2);');
    expect(readRule(css, '.portfolio-hero__sky-card')).toContain('height: var(--reference-art-height);');
    expect(readRule(css, '.portfolio-hero__sky-card')).toContain('padding: 8px;');
    expect(readRule(css, '.portfolio-hero__sky-card')).toContain('width: var(--reference-art-width);');
    expect(readRule(css, '.portfolio-hero__sky-image')).toContain('border-radius: 24px;');
    expect(readRule(css, '.portfolio-hero__sky-image')).toContain('min-height: 0;');
    expect(readRule(css, '.portfolio-hero__fleet-background')).toContain('position: absolute;');
    expect(readRule(css, '.portfolio-hero__fleet-background')).toContain('animation: home-fleet-page-cruise 600s linear infinite;');
    expect(readRule(css, '.portfolio-hero__fleet-background')).toContain('animation-delay: var(--home-fleet-delay, 600s);');
    expect(readRule(css, '.portfolio-hero__fleet-background')).not.toContain('animation-delay: -');
    expect(readRule(css, '.portfolio-hero__fleet-background')).toContain('pointer-events: none;');
    expect(readRule(css, '.portfolio-hero__fleet-background')).toContain('width: clamp(180px, 24vw, 340px);');
    expect(readRule(css, '.portfolio-hero__fleet-background')).toContain('z-index: -1;');
    expect(readRule(css, '.portfolio-hero__fleet-sketch')).toBe('');
    expect(normalizedCss).toContain('@keyframes home-fleet-page-cruise');
    expect(normalizedCss).toContain(`@keyframes home-fleet-page-cruise {
  0% {
    transform: translate3d(-34vw, 0, 0);
  }

  4% {
    transform: translate3d(112vw, 0, 0);
  }

  100% {
    transform: translate3d(112vw, 0, 0);
  }
}`);
    expect(normalizedCss).not.toContain('@keyframes home-fleet-sketch-cruise');
    expect(readRule(css, '.portfolio-hero__portrait')).toContain('border-radius: 32px;');
    expect(readRule(css, '.portfolio-hero__portrait')).toContain('padding: 9px;');
    expect(readRuleContainingSelector(css, '.portfolio-hero__calendar-card')).toContain(
      'border-color: rgba(148, 163, 184, 0.26);',
    );
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('left: calc(var(--reference-center-x) + var(--reference-gap) + var(--reference-hi-width) / 2);');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('top: calc(var(--reference-center-y) - var(--reference-clock-offset) + var(--reference-gap));');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('height: var(--reference-calendar-height);');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('border-radius: 40px;');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('gap: 0;');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('min-height: var(--reference-calendar-height);');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('padding: 20px;');
    expect(readLastRule(css, '.portfolio-hero__calendar-card')).toContain('width: var(--reference-calendar-width);');
    expect(readRule(css, '.portfolio-hero__calendar-card ol')).toContain('height: 186px;');
    expect(readRule(css, '.portfolio-hero__calendar-card ol')).toContain('grid-template-columns: repeat(7, minmax(0, 1fr));');
    expect(readRule(css, '.portfolio-hero__calendar-card li')).toContain('aspect-ratio: auto;');
    expect(readRule(css, '.portfolio-hero__calendar-card li')).toContain('min-height: 0;');
    expect(readRule(css, '.portfolio-hero__calendar-card li')).toContain('min-width: 0;');
    expect(readRule(css, ".portfolio-hero__calendar-card li[data-current='true']")).toContain('border: 1px solid #ffffff;');
    expect(readRule(css, '.portfolio-hero__like-card')).toContain('border-radius: 999px;');
    expect(readRule(css, '.portfolio-hero__like-card')).toContain('height: 48px;');
    expect(readRule(css, '.portfolio-hero__like-card')).toContain('width: 48px;');
  });

  test('uses a tablet hero layout before fixed desktop cards can overlap', () => {
    const css = readGlobalStyles();
    const heroContentBlock = readMediaRule(css, '(max-width: 1160px) and (min-width: 821px)', '.portfolio-hero__content');
    const navBlock = readMediaRule(css, '(max-width: 1160px) and (min-width: 821px)', '.portfolio-hero__card-nav');
    const clockBlock = readMediaRule(css, '(max-width: 1160px) and (min-width: 821px)', '.portfolio-hero__clock-card');
    const calendarBlock = readMediaRule(
      css,
      '(max-width: 1160px) and (min-width: 821px)',
      '.portfolio-hero__calendar-card',
    );

    expect(heroContentBlock).toContain('grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);');
    expect(heroContentBlock).toContain('"nav intro"');
    expect(heroContentBlock).toContain('"latest recommendation"');
    expect(heroContentBlock).toContain('". actions"');
    expect(navBlock).toContain('translate: none;');
    expect(clockBlock).toContain('width: 100%;');
    expect(calendarBlock).toContain('width: 100%;');
  });
});
