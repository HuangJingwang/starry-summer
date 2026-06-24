'use client';

import { useEffect } from 'react';

import {
  getMillisecondsUntilNextThemeBoundary,
  getThemeCookie,
  getThemeForTime,
  isSiteTheme,
  setThemeCookie,
  themeStorageKey,
} from '@/lib/site-theme';

function getSessionTheme() {
  const savedTheme = window.sessionStorage.getItem(themeStorageKey);

  return isSiteTheme(savedTheme) ? savedTheme : null;
}

export function ThemeSync() {
  useEffect(() => {
    let timer: number;

    function syncAutoTheme() {
      const sessionTheme = getSessionTheme();
      const nextTheme = sessionTheme ?? getThemeCookie() ?? getThemeForTime();

      document.documentElement.dataset.theme = nextTheme;
      if (sessionTheme) {
        setThemeCookie(nextTheme);
      }
      timer = window.setTimeout(syncAutoTheme, getMillisecondsUntilNextThemeBoundary());
    }

    syncAutoTheme();

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
