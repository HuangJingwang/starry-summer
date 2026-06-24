import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('ThemeToggle', () => {
  test('uses a single icon button while defaulting to time based theme sync with cookie persistence', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ThemeToggle.tsx'), 'utf8');

    expect(source).toContain("'use client';");
    expect(source).toContain('getMillisecondsUntilNextThemeBoundary,');
    expect(source).toContain('getThemeCookie,');
    expect(source).toContain('getThemeForTime,');
    expect(source).toContain('setThemeCookie,');
    expect(source).toContain('themeStorageKey,');
    expect(source).toContain('function getSessionTheme()');
    expect(source).toContain('window.sessionStorage.getItem(themeStorageKey)');
    expect(source).toContain('sessionTheme ?? getThemeCookie() ?? getThemeForTime()');
    expect(source).toContain('window.sessionStorage.setItem(themeStorageKey, nextTheme)');
    expect(source).toContain('setThemeCookie(nextTheme);');
    expect(source).not.toContain("type ThemeMode = 'auto' | SiteTheme;");
    expect(source).toContain('getMillisecondsUntilNextThemeBoundary()');
    expect(source).not.toContain('window.localStorage');
    expect(source).toContain('document.documentElement.dataset.theme = nextTheme;');
    expect(source).toContain("aria-label=\"主题切换\"");
    expect(source).toContain('onClick={toggleTheme}');
    expect(source).toContain('theme-toggle__icon');
    expect(source).toContain("{theme === 'summer-day' ? '☀' : '☾'}");
    expect(source).toContain('切换到${themeLabels[nextTheme]}模式');
    expect(source).not.toContain('aria-pressed=');
  });
});

describe('first paint theme contract', () => {
  test('server layout stays static-compatible while the inline script applies the saved theme before hydration', () => {
    const layoutSource = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');

    expect(layoutSource).not.toContain("next/headers");
    expect(layoutSource).not.toContain('cookies()');
    expect(layoutSource).not.toContain('getInitialThemeFromCookie');
    expect(layoutSource).toContain("import { getThemeInitScript } from '@/lib/site-theme';");
    expect(layoutSource).toContain('data-theme="summer-night"');
    expect(layoutSource).toContain('suppressHydrationWarning');
    expect(layoutSource).toContain('<script id="theme-init" dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />');
  });
});
