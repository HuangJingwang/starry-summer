import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { ReaderReveal } from './ReaderMotion';

test('reader reveals keep server-rendered content visible and preserve list semantics', () => {
  const html = renderToStaticMarkup(<ReaderReveal as="li" index={2}>可阅读的内容</ReaderReveal>);
  expect(html).toMatch(/^<li/);
  expect(html).toContain('可阅读的内容');
  expect(html).not.toContain('opacity:0');
  expect(html).not.toContain('visibility:hidden');
});

test('reader motion has scoped reduced-motion and touch fallbacks', () => {
  const css = readFileSync(new URL('../app/styles/editorial.css', import.meta.url), 'utf8');
  expect(css).toContain('.reader-reveal, .reader-resource-card, .about-portrait-motion');
  expect(css).toContain('.reader-kind-indicator');
  expect(css).toContain('@media (hover: hover) and (pointer: fine)');
});
