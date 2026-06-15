'use client';

import { useEffect, useState } from 'react';

type SiteTheme = 'summer-day' | 'summer-night';
const sessionThemeKey = 'starry-summer-theme';

const themeLabels: Record<SiteTheme, string> = {
  'summer-day': '白天',
  'summer-night': '黑夜',
};

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

function applyTheme(nextTheme: SiteTheme) {
  document.documentElement.dataset.theme = nextTheme;
}

function getSessionTheme() {
  const savedTheme = window.sessionStorage.getItem(sessionThemeKey);

  return isSiteTheme(savedTheme) ? savedTheme : null;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<SiteTheme>('summer-night');

  useEffect(() => {
    let timer: number;

    function syncAutoTheme() {
      const nextTheme = getSessionTheme() ?? getThemeForTime();
      setTheme(nextTheme);
      applyTheme(nextTheme);
      timer = window.setTimeout(syncAutoTheme, getMillisecondsUntilNextThemeBoundary());
    }

    syncAutoTheme();

    return () => window.clearTimeout(timer);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'summer-day' ? 'summer-night' : 'summer-day';

    window.sessionStorage.setItem(sessionThemeKey, nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const nextTheme = theme === 'summer-day' ? 'summer-night' : 'summer-day';

  return (
    <div className="theme-toggle" aria-label="主题切换">
      <button type="button" aria-label={`切换到${themeLabels[nextTheme]}模式`} title={`切换到${themeLabels[nextTheme]}模式`} onClick={toggleTheme}>
        <span className="theme-toggle__icon" aria-hidden="true">
          {theme === 'summer-day' ? '☀' : '☾'}
        </span>
      </button>
    </div>
  );
}
