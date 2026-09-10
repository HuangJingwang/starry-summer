import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

import HomePage, { metadata } from './page';
import HomeAliasPage from './home/page';

vi.mock('@/lib/public-content', () => ({ loadSiteContent: async () => [
  { id: 'latest', slug: 'latest-story', title: '最新公开文章', summary: '公开摘要', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-09-09' },
  { id: 'private', slug: 'private', title: '不可公开的草稿', type: 'post', status: 'draft', visibility: 'private', publishedAt: '2026-09-10' },
] }));
vi.mock('@/lib/settings-repository', () => ({ loadSiteSettings: async () => ({ profile: { description: 'Aster.H 的个人内容平台。' } }) }));
const redirect = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ redirect, usePathname: () => '/' }));

describe('unified journal homepage', () => {
  test('publishes the same editorial homepage reached by the reader return links', async () => {
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain('STARRY');
    expect(html).toContain('Aster.H');
    expect(html).toContain('最新公开文章');
    expect(html).toContain('href="/posts/latest-story"');
    expect(html).toContain('aria-label="Starry Summer，Aster.H 的个人博客"');
    expect(html).toContain('id="recommendations"');
    expect(html).toContain('React Bits');
    expect(html).not.toContain('不可公开的草稿');
    for (const destination of ['/posts', '/notes', '/moments', '/projects', '/about', '/archives', '/search']) expect(html).toContain('href="' + destination + '"');
  });
  test('the real homepage stays indexable and /home resolves to that same route', () => {
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe('/');
    HomeAliasPage();
    expect(redirect).toHaveBeenCalledWith('/');
  });
});
