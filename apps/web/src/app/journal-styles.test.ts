import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const css = readFileSync(new URL('./styles/journal.css', import.meta.url), 'utf8');
test('highlighted search titles remain inline text, including on phones', () => {
  expect(css).toMatch(/\.search-result-card h2 a\s*\{[^}]*display:\s*inline;/);
});
test('journal palettes stay scoped away from administration and preserve a light theme', () => {
  expect(css).toContain(":root[data-theme='summer-day'] .journal-shell");
  expect(css).toContain('--journal-bg: #0a0d0f;');
  expect(css).toContain('--journal-bg: #eef0eb;');
  expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  expect(css).not.toMatch(/(?:^|\n)\s*(?:body|input|button)\s*\{/);
});
