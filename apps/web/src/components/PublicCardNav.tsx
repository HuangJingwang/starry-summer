'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, FocusEvent, MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { NavigationItem } from '@/lib/navigation';

type SiteTheme = 'summer-day' | 'summer-night';

const transitionStorageKey = 'starry-summer-home-nav-transition';
const sessionThemeKey = 'starry-summer-theme';

const referenceNavItems = [
  {
    href: '/posts',
    label: '近期文章',
    outline: '/images/reference-nav/scroll-outline.svg',
    filled: '/images/reference-nav/scroll-filled.svg',
  },
  {
    href: '/projects',
    label: '我的项目',
    outline: '/images/reference-nav/projects-outline.svg',
    filled: '/images/reference-nav/projects-filled.svg',
  },
  {
    href: '/about',
    label: '关于网站',
    outline: '/images/reference-nav/about-outline.svg',
    filled: '/images/reference-nav/about-filled.svg',
  },
  {
    href: '/moments',
    label: '推荐分享',
    outline: '/images/reference-nav/share-outline.svg',
    filled: '/images/reference-nav/share-filled.svg',
  },
  {
    href: '/about#links',
    label: '优秀博客',
    outline: '/images/reference-nav/website-outline.svg',
    filled: '/images/reference-nav/website-filled.svg',
  },
] as const;

export function PublicCardNav({ title, navItems }: { title: string; navItems: NavigationItem[] }) {
  const pathname = usePathname();
  const [arrivedFromHome, setArrivedFromHome] = useState(false);
  void navItems;

  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        referenceNavItems.findIndex((item) => isActivePath(pathname, item.href)),
      ),
    [pathname],
  );
  const [hoveredIndex, setHoveredIndex] = useState(activeIndex);
  const updateHoveredIndex = (event: FocusEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-nav-index]');

    if (!link || !event.currentTarget.contains(link)) {
      return;
    }

    const nextIndex = Number(link.dataset.navIndex);

    if (Number.isInteger(nextIndex)) {
      setHoveredIndex(nextIndex);
    }
  };
  const navStyle = {
    '--active-index': activeIndex,
    '--hover-index': hoveredIndex,
    '--nav-count': referenceNavItems.length,
  } as CSSProperties;

  useEffect(() => {
    setHoveredIndex(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    let timer: number;

    function syncAutoTheme() {
      const savedTheme = window.sessionStorage.getItem(sessionThemeKey);
      const nextTheme = isSiteTheme(savedTheme) ? savedTheme : getThemeForTime();

      document.documentElement.dataset.theme = nextTheme;
      timer = window.setTimeout(syncAutoTheme, getMillisecondsUntilNextThemeBoundary());
    }

    syncAutoTheme();

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const transitionTarget = window.sessionStorage.getItem(transitionStorageKey);
    const targetPathname = transitionTarget?.split('?')[0];

    if (!targetPathname || !isActivePath(pathname, targetPathname)) {
      return;
    }

    window.sessionStorage.removeItem(transitionStorageKey);
    setArrivedFromHome(true);

    const timeoutId = window.setTimeout(() => setArrivedFromHome(false), 680);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <header className={`site-header site-nav-card${arrivedFromHome ? ' site-nav-card--from-home' : ''}`}>
      <Link className="brand site-nav-card__brand" href="/#top" aria-label={`${title} 首页`}>
        <img className="brand-avatar brand-avatar--night" src="/images/aster-profile.png" alt="" aria-hidden="true" />
        <img className="brand-avatar brand-avatar--day" src="/images/aster-day-profile-v2.png" alt="" aria-hidden="true" />
      </Link>
      <div className="site-nav-card__body">
        <nav className="site-nav" aria-label="主导航">
          <div
            className="site-nav__items"
            style={navStyle}
            data-active-index={activeIndex}
            data-hover-index={hoveredIndex}
            onFocusCapture={updateHoveredIndex}
            onMouseLeave={() => setHoveredIndex(activeIndex)}
            onMouseOver={updateHoveredIndex}
          >
            <span className="site-nav__hover" aria-hidden="true" />
            {referenceNavItems.map((item, index) => {
              const active = isActivePath(pathname, item.href);
              const iconStyle = {
                '--nav-icon-outline': `url(${item.outline})`,
                '--nav-icon-filled': `url(${item.filled})`,
              } as CSSProperties;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  data-hovered={hoveredIndex === index ? 'true' : undefined}
                  data-nav-index={index}
                  title={item.label}
                >
                  <span className="site-nav__icon" style={iconStyle} aria-hidden="true" />
                  <span className="site-nav__label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/posts') {
    return pathname === '/posts' || pathname.startsWith('/posts/') || pathname === '/notes' || pathname.startsWith('/notes/');
  }

  if (href.includes('#')) {
    return pathname === href.split('#')[0];
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getThemeForTime(date = new Date()): SiteTheme {
  const hour = date.getHours();

  return hour >= 6 && hour < 18 ? 'summer-day' : 'summer-night';
}

function isSiteTheme(value: string | null): value is SiteTheme {
  return value === 'summer-day' || value === 'summer-night';
}

function getMillisecondsUntilNextThemeBoundary(date = new Date()) {
  const nextBoundary = new Date(date);
  const hour = date.getHours();

  nextBoundary.setHours(hour < 6 ? 6 : hour < 18 ? 18 : 30, 0, 0, 0);

  return nextBoundary.getTime() - date.getTime();
}
