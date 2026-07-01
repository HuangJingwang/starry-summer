'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, FocusEvent, MouseEvent } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import type { NavigationItem } from '@/lib/navigation';

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
    href: '/leetcode',
    label: '刷题日记',
    outline: '/images/reference-nav/leetcode-outline.svg',
    filled: '/images/reference-nav/leetcode-filled.svg',
  },
] as const;

export function PublicCardNav({ title, navItems }: { title: string; navItems: NavigationItem[] }) {
  const pathname = usePathname();
  const [arrivedFromHome, setArrivedFromHome] = useState(false);
  const [arrivalStyle, setArrivalStyle] = useState<CSSProperties | undefined>();
  const headerRef = useRef<HTMLElement | null>(null);
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
  const hoverRestoreTimeoutRef = useRef<number | null>(null);
  const clearHoveredIndexRestore = () => {
    if (hoverRestoreTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(hoverRestoreTimeoutRef.current);
    hoverRestoreTimeoutRef.current = null;
  };
  const scheduleHoveredIndexRestore = () => {
    clearHoveredIndexRestore();
    hoverRestoreTimeoutRef.current = window.setTimeout(() => {
      setHoveredIndex(activeIndex);
      hoverRestoreTimeoutRef.current = null;
    }, 1200);
  };
  const restoreHoveredIndexWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget;

    if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
      scheduleHoveredIndexRestore();
    }
  };
  const updateHoveredIndex = (event: FocusEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-nav-index]');

    if (!link || !event.currentTarget.contains(link)) {
      return;
    }

    const nextIndex = Number(link.dataset.navIndex);

    if (Number.isInteger(nextIndex)) {
      clearHoveredIndexRestore();
      setHoveredIndex(nextIndex);
    }
  };
  const navStyle = {
    '--active-index': activeIndex,
    '--hover-index': hoveredIndex,
    '--nav-count': referenceNavItems.length,
  } as CSSProperties;
  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (shouldUseNativeNavigation(event)) {
      return;
    }

    const rect = headerRef.current?.getBoundingClientRect();

    window.sessionStorage.setItem(
      transitionStorageKey,
      JSON.stringify({
        href: '/',
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
  };

  useEffect(() => {
    clearHoveredIndexRestore();
    setHoveredIndex(activeIndex);
  }, [activeIndex]);

  useEffect(() => () => clearHoveredIndexRestore(), []);

  useLayoutEffect(() => {
    const transitionPayload = readHomeNavTransitionPayload(window.sessionStorage.getItem(transitionStorageKey));
    const targetPathname = transitionPayload?.href.split('?')[0];

    if (!targetPathname || !isActivePath(pathname, targetPathname)) {
      return;
    }

    window.sessionStorage.removeItem(transitionStorageKey);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const sourceRect = transitionPayload.rect;
    const destinationRect = headerRef.current?.getBoundingClientRect();

    if (sourceRect && destinationRect) {
      setArrivalStyle({
        '--nav-arrive-scale-x': sourceRect.width / destinationRect.width,
        '--nav-arrive-scale-y': sourceRect.height / destinationRect.height,
        '--nav-arrive-x': `${sourceRect.left - destinationRect.left}px`,
        '--nav-arrive-y': `${sourceRect.top - destinationRect.top}px`,
      } as CSSProperties);
    } else {
      setArrivalStyle(undefined);
    }

    setArrivedFromHome(true);
  }, [pathname]);

  useEffect(() => {
    if (!arrivedFromHome) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setArrivedFromHome(false);
      setArrivalStyle(undefined);
    }, 760);

    return () => window.clearTimeout(timeoutId);
  }, [arrivedFromHome]);

  return (
    <header
      ref={headerRef}
      className={`site-header site-nav-card${arrivedFromHome ? ' site-nav-card--from-home' : ''}`}
      style={arrivalStyle}
    >
      <Link className="brand site-nav-card__brand" href="/" aria-label={`${title} 首页`} onClick={handleBrandClick}>
        <img className="brand-avatar" src="/images/aster-day-profile.png" alt="" aria-hidden="true" />
      </Link>
      <div className="site-nav-card__body">
        <nav className="site-nav" aria-label="主导航">
          <div
            className="site-nav__items"
            style={navStyle}
            data-active-index={activeIndex}
            data-hover-index={hoveredIndex}
            onBlurCapture={restoreHoveredIndexWhenFocusLeaves}
            onFocusCapture={updateHoveredIndex}
            onMouseLeave={scheduleHoveredIndexRestore}
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
      <div className="site-nav-card__tools">
        <ThemeToggle />
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

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
