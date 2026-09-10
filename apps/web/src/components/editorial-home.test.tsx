import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { EditorialHome } from './EditorialHome';

vi.mock('./EditorialMotion', () => ({ HeroCharacter: () => null }));

test('homepage renders configured social profiles as safe external links beside reading', () => {
  const html = renderToStaticMarkup(<EditorialHome articles={[]} projects={[]} socialLinks={[
    { label: 'GitHub', href: 'https://github.com/example' },
    { label: '掘金', href: 'https://juejin.cn/user/123' },
  ]} />);
  expect(html).toContain('aria-label="社交主页"');
  expect(html).toContain('href="https://github.com/example" target="_blank" rel="noopener noreferrer"');
  expect(html).toContain('href="https://juejin.cn/user/123" target="_blank" rel="noopener noreferrer"');
  expect(html).toContain('掘金（在新标签页打开）');
  expect(html).toContain('开始阅读');
});

test('homepage omits empty social navigation when profiles are not configured', () => {
  expect(renderToStaticMarkup(<EditorialHome articles={[]} projects={[]} socialLinks={[]} />)).not.toContain('aria-label="社交主页"');
});
