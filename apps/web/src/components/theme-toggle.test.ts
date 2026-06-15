import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('ThemeToggle', () => {
  test('uses a single icon button while defaulting to time based theme sync with session preview persistence', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ThemeToggle.tsx'), 'utf8');

    expect(source).toContain("'use client';");
    expect(source).toContain("const sessionThemeKey = 'starry-summer-theme';");
    expect(source).toContain('function isSiteTheme(value: string | null): value is SiteTheme');
    expect(source).toContain('function getSessionTheme()');
    expect(source).toContain('window.sessionStorage.getItem(sessionThemeKey)');
    expect(source).toContain('getSessionTheme() ?? getThemeForTime()');
    expect(source).toContain('window.sessionStorage.setItem(sessionThemeKey, nextTheme)');
    expect(source).not.toContain("type ThemeMode = 'auto' | SiteTheme;");
    expect(source).toContain("function getThemeForTime(date = new Date()): SiteTheme");
    expect(source).toContain("hour >= 6 && hour < 18 ? 'summer-day' : 'summer-night'");
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
