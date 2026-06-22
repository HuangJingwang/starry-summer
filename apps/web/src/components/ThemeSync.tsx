'use client';

import { useEffect } from 'react';

type SiteTheme = 'summer-day' | 'summer-night';
const sessionThemeKey = 'starry-summer-theme';

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

function getSessionTheme() {
  const savedTheme = window.sessionStorage.getItem(sessionThemeKey);

  return isSiteTheme(savedTheme) ? savedTheme : null;
}

export function ThemeSync() {
  useEffect(() => {
    let timer: number;

    function syncAutoTheme() {
      const nextTheme = getSessionTheme() ?? getThemeForTime();

      document.documentElement.dataset.theme = nextTheme;
      timer = window.setTimeout(syncAutoTheme, getMillisecondsUntilNextThemeBoundary());
    }

    syncAutoTheme();

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
