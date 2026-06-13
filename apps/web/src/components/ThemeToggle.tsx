'use client';

import { useEffect, useState } from 'react';

const themeStorageKey = 'starry-summer-theme';
type SiteTheme = 'summer-day' | 'summer-night';

function isSiteTheme(value: string | null): value is SiteTheme {
  return value === 'summer-day' || value === 'summer-night';
}

function readStoredTheme() {
  try {
    return window.localStorage.getItem(themeStorageKey);
  } catch {
    return null;
  }
}

function storeTheme(nextTheme: SiteTheme) {
  try {
    window.localStorage.setItem(themeStorageKey, nextTheme);
  } catch {
    // Theme switching still works when storage is unavailable in embedded browsers.
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<SiteTheme>('summer-night');

  useEffect(() => {
    const storedTheme = readStoredTheme();
    const initialTheme = isSiteTheme(storedTheme) ? storedTheme : 'summer-night';

    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  function chooseTheme(nextTheme: SiteTheme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    storeTheme(nextTheme);
  }

  return (
    <div className="theme-toggle" aria-label="主题切换">
      <button type="button" aria-pressed={theme === 'summer-day'} onClick={() => chooseTheme('summer-day')}>
        白天
      </button>
      <button type="button" aria-pressed={theme === 'summer-night'} onClick={() => chooseTheme('summer-night')}>
        黑夜
      </button>
    </div>
  );
}
