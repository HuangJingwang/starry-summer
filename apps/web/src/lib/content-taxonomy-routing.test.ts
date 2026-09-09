import { expect, test } from 'vitest';
import { getContentByCategorySlug, getContentBySeriesSlug, getContentByTagSlug } from './content-taxonomy';
import type { SiteContentItem } from './content-types';

test('Chinese taxonomy links resolve both URL-encoded and decoded route parameters', () => {
  const items = [{ id: 'one', title: '文章', slug: 'story', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-09-09', categories: ['后端'], tags: ['后端'], series: ['后端'] }] as SiteContentItem[];
  for (const find of [getContentByCategorySlug, getContentByTagSlug, getContentBySeriesSlug]) {
    expect(find(items, '后端')?.items[0]?.id).toBe('one');
    expect(find(items, encodeURIComponent('后端'))?.items[0]?.id).toBe('one');
    expect(find(items, '%invalid')).toBeNull();
  }
});
