import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('ThemeToggle', () => {
  test('persists and applies the day night theme choice on the document root', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ThemeToggle.tsx'), 'utf8');

    expect(source).toContain("'use client';");
    expect(source).toContain("const themeStorageKey = 'starry-summer-theme';");
    expect(source).toContain('window.localStorage.getItem(themeStorageKey)');
    expect(source).toContain('window.localStorage.setItem(themeStorageKey, nextTheme);');
    expect(source).toContain('document.documentElement.dataset.theme = nextTheme;');
    expect(source).toContain("aria-label=\"主题切换\"");
    expect(source).toContain("aria-pressed={theme === 'summer-day'}");
    expect(source).toContain("aria-pressed={theme === 'summer-night'}");
    expect(source).toContain('白天');
    expect(source).toContain('黑夜');
  });
});
