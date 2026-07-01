'use client';

import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import type { CSSProperties, MouseEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  getMillisecondsUntilNextThemeBoundary,
  getThemeCookie,
  getThemeForTime,
  isSiteTheme,
  setThemeCookie,
  themeStorageKey,
  type SiteTheme,
} from '@/lib/site-theme';

const transitionStorageKey = 'starry-summer-home-nav-transition';

interface HomeNavTransitionPayload {
  href: string;
  rect?: {
    height: number;
    left: number;
    top: number;
    width: number;
  } | null;
}

const homeNavItems = [
  {
    href: '/posts',
    label: '近期文章',
    icon: '/images/reference-nav/scroll-outline.svg',
    iconActive: '/images/reference-nav/scroll-filled.svg',
  },
  {
    href: '/projects',
    label: '我的项目',
    icon: '/images/reference-nav/projects-outline.svg',
    iconActive: '/images/reference-nav/projects-filled.svg',
  },
  {
    href: '/about',
    label: '关于网站',
    icon: '/images/reference-nav/about-outline.svg',
    iconActive: '/images/reference-nav/about-filled.svg',
  },
  {
    href: '/moments',
    label: '推荐分享',
    icon: '/images/reference-nav/share-outline.svg',
    iconActive: '/images/reference-nav/share-filled.svg',
  },
  {
    href: '/leetcode',
    label: '刷题日记',
    icon: '/images/reference-nav/leetcode-outline.svg',
    iconActive: '/images/reference-nav/leetcode-filled.svg',
  },
] as const;

export function HomeCardNav() {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [returnedFromModule, setReturnedFromModule] = useState(false);
  const [returnStyle, setReturnStyle] = useState<CSSProperties | undefined>();
  const [theme, setTheme] = useState<SiteTheme>('summer-night');
  const navCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timer: number;

    function syncAutoTheme() {
      const savedTheme = window.sessionStorage.getItem(themeStorageKey);
      const sessionTheme = isSiteTheme(savedTheme) ? savedTheme : null;
      const nextTheme = sessionTheme ?? getThemeCookie() ?? getThemeForTime();

      document.documentElement.dataset.theme = nextTheme;
      if (sessionTheme) {
        setThemeCookie(nextTheme);
      }
      setTheme(nextTheme);
      timer = window.setTimeout(syncAutoTheme, getMillisecondsUntilNextThemeBoundary());
    }

    syncAutoTheme();

    return () => window.clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    const transitionPayload = readHomeNavTransitionPayload(window.sessionStorage.getItem(transitionStorageKey));

    if (transitionPayload?.href !== '/') {
      return;
    }

    window.sessionStorage.removeItem(transitionStorageKey);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const sourceRect = transitionPayload.rect;
    const destinationRect = navCardRef.current?.getBoundingClientRect();

    if (sourceRect && destinationRect) {
      setReturnStyle({
        '--home-nav-return-scale-x': sourceRect.width / destinationRect.width,
        '--home-nav-return-scale-y': sourceRect.height / destinationRect.height,
        '--home-nav-return-x': `${sourceRect.left - destinationRect.left}px`,
        '--home-nav-return-y': `${sourceRect.top - destinationRect.top}px`,
      } as CSSProperties);
    } else {
      setReturnStyle(undefined);
    }

    setReturnedFromModule(true);
  }, []);

  useEffect(() => {
    if (!returnedFromModule) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setReturnedFromModule(false);
      setReturnStyle(undefined);
    }, 760);

    return () => window.clearTimeout(timeoutId);
  }, [returnedFromModule]);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (shouldUseNativeNavigation(event)) {
      return;
    }

    const navCard = event.currentTarget.closest('.portfolio-hero__nav-card');
    const rect = navCard instanceof HTMLElement ? navCard.getBoundingClientRect() : null;

    window.sessionStorage.setItem(
      transitionStorageKey,
      JSON.stringify({
        href,
        rect: rect
          ? {
              height: rect.height,
              left: rect.left,
              top: rect.top,
              width: rect.width,
            }
          : null,
      }),
    );
    setPendingHref(href);
  }

  function toggleTheme() {
    const nextTheme = theme === 'summer-day' ? 'summer-night' : 'summer-day';

    window.sessionStorage.setItem(themeStorageKey, nextTheme);
    setThemeCookie(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
  }

  return (
    <nav
      className={`portfolio-hero__card-nav${returnedFromModule ? ' portfolio-hero__card-nav--from-module' : ''}`}
      aria-label="主页导航"
      data-transitioning={pendingHref ? 'true' : undefined}
      style={returnStyle}
    >
      <div ref={navCardRef} className="portfolio-hero__nav-card">
        <Link className="portfolio-hero__nav-brand" href="/">
          <img className="portfolio-hero__nav-avatar portfolio-hero__nav-avatar--night" src="/images/aster-profile.png" alt="" />
          <img className="portfolio-hero__nav-avatar portfolio-hero__nav-avatar--day" src="/images/aster-day-profile.png" alt="" />
          <span>
            <strong>Aster.H</strong>
            <small>(开发中)</small>
          </span>
        </Link>
        <p className="portfolio-hero__nav-kicker">General</p>
        <div className="portfolio-hero__nav-links" data-active="writing">
          {homeNavItems.map((item, index) => {
            const iconStyle = {
              '--nav-icon-outline': `url(${item.icon})`,
              '--nav-icon-filled': `url(${item.iconActive})`,
            } as CSSProperties;
            const isActive = pendingHref === item.href || (!pendingHref && index === 0);

            return (
              <Link
                key={item.href}
                href={item.href}
                data-home-nav-link="true"
                data-active={isActive ? 'true' : undefined}
                data-pending={pendingHref === item.href ? 'true' : undefined}
                onClick={(event) => handleNavClick(event, item.href)}
              >
                <span className="portfolio-hero__nav-icon" style={iconStyle} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="portfolio-hero__nav-footer">
          <span>STARRY SUMMER</span>
          <button
            type="button"
            className="portfolio-hero__nav-theme"
            aria-label={`切换到${theme === 'summer-day' ? '黑夜' : '白天'}模式`}
            title={`切换到${theme === 'summer-day' ? '黑夜' : '白天'}模式`}
            onClick={toggleTheme}
          >
            {theme === 'summer-day' ? <Sun size={18} strokeWidth={1.8} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.8} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function readHomeNavTransitionPayload(value: string | null): HomeNavTransitionPayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<HomeNavTransitionPayload>;

    if (typeof parsed.href === 'string') {
      return parsed as HomeNavTransitionPayload;
    }
  } catch {
    return { href: value };
  }

  return null;
}
