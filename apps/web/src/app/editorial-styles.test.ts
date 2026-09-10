import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
const css = readFileSync(new URL('./styles/editorial.css', import.meta.url), 'utf8');
test('the new home and resource system keeps theme, accessibility and responsive contracts', () => {
  expect(css).toContain(":root[data-theme='summer-day'] .journal-shell");
  expect(css).toContain('--journal-bg: #0c0e10');
  expect(css).toContain('--journal-bg: #f2f4f5');
  expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  expect(css).toContain('@media (prefers-reduced-transparency: reduce)');
  expect(css).toContain('env(safe-area-inset-bottom)');
  expect(css).toContain('.editorial-project-slot { position: static;');
  expect(css).toContain('.resource-card .sr-only { position: absolute;');
  expect(css).toContain('.share-page__search > span { position: static;');
  expect(css).toContain('.editorial-archive-filter input::placeholder { color: var(--journal-muted);');
  expect(css).not.toMatch(/(?:^|\n)\s*(?:body|input|button)\s*\{/);
});
