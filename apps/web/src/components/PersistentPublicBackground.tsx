'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { StarrySkyCanvas } from '@/components/StarrySkyCanvas';

type SiteTheme = 'summer-day' | 'summer-night';

const publicBackgroundPrefixes = [
  '/about',
  '/archives',
  '/categories',
  '/guestbook',
  '/leetcode',
  '/moments',
  '/notes',
  '/posts',
  '/projects',
  '/search',
  '/series',
  '/tags',
] as const;

function getTheme(): SiteTheme {
  return document.documentElement.dataset.theme === 'summer-day' ? 'summer-day' : 'summer-night';
}

export function isPersistentPublicBackgroundPath(pathname: string | null): boolean {
  if (!pathname || pathname === '/' || pathname === '/home') {
    return false;
  }

  return publicBackgroundPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function PersistentPublicBackground() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<SiteTheme | null>(null);
  const isPublicModule = isPersistentPublicBackgroundPath(pathname);
  const isActive = isPublicModule && theme === 'summer-night';

  useEffect(() => {
    setTheme(getTheme());

    const themeObserver = new MutationObserver(() => {
      setTheme(getTheme());
    });

    themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'], attributes: true });

    return () => {
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className="persistent-public-background"
      data-active={isActive ? 'true' : undefined}
      data-public-module={isPublicModule ? 'true' : undefined}
      aria-hidden="true"
    >
      {isPublicModule ? <StarrySkyCanvas className="site-shell__canvas" showFleet={false} active={isActive} /> : null}
    </div>
  );
}
