import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const source = () => readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('about introduces the owner while retaining content and social destinations', () => {
  expect(source()).toContain('你好，我是');
  expect(source()).toContain('Aster.H');
  expect(source()).toContain('关于本站');
  expect(source()).toContain('写在这里');
  expect(source()).toContain('这个网站怎么搭的');
  for (const href of ['/posts', '/moments', '/projects']) expect(source()).toContain(`href: '${href}'`);
  expect(source()).toContain('settings.profile.socialLinks.map');
  expect(source()).toContain('AboutPortraitMotion');
  expect(source()).toContain('HeroCharacter');
  expect(source()).toContain('aria-label={`${link.label}（在新标签页打开）`}');
});

test('about typography and layout remain route-scoped with a mobile fallback', () => {
  const css = readFileSync(new URL('./about.module.css', import.meta.url), 'utf8');
  expect(css).toContain('font-weight: 400');
  expect(css).toContain('var(--journal-display)');
  expect(css).toContain('var(--font-nav)');
  expect(css).toContain('@media (max-width: 767px)');
  expect(css).toContain('grid-template-columns: 1fr');
  expect(css).toContain('prefers-reduced-motion');
  expect(css).toContain('summer-day');
});
