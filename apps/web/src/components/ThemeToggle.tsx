'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import {
  getMillisecondsUntilNextThemeBoundary,
  getThemeCookie,
  getThemeForTime,
  isSiteTheme,
  setThemeCookie,
  themeStorageKey,
  type SiteTheme,
} from '@/lib/site-theme';

const themeLabels: Record<SiteTheme, string> = {
  'summer-day': '白天',
  'summer-night': '黑夜',
};

function applyTheme(nextTheme: SiteTheme) {
  document.documentElement.dataset.theme = nextTheme;
}

function getSessionTheme() {
  const savedTheme = window.sessionStorage.getItem(themeStorageKey);

  return isSiteTheme(savedTheme) ? savedTheme : null;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<SiteTheme>('summer-night');

  useEffect(() => {
    let timer: number;

    function syncAutoTheme() {
      const sessionTheme = getSessionTheme();
      const nextTheme = sessionTheme ?? getThemeCookie() ?? getThemeForTime();

      setTheme(nextTheme);
      applyTheme(nextTheme);
      if (sessionTheme) {
        setThemeCookie(nextTheme);
      }
      timer = window.setTimeout(syncAutoTheme, getMillisecondsUntilNextThemeBoundary());
    }

    syncAutoTheme();

    return () => window.clearTimeout(timer);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'summer-day' ? 'summer-night' : 'summer-day';

    window.sessionStorage.setItem(themeStorageKey, nextTheme);
    setThemeCookie(nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const nextTheme = theme === 'summer-day' ? 'summer-night' : 'summer-day';

  return (
    <div className="theme-toggle" aria-label="主题切换">
      <button type="button" aria-label={`切换到${themeLabels[nextTheme]}模式`} title={`切换到${themeLabels[nextTheme]}模式`} onClick={toggleTheme}>
        {theme === 'summer-day' ? <Sun size={18} strokeWidth={1.8} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.8} aria-hidden="true" />}
      </button>
    </div>
  );
}
