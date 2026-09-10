import { expect, test } from 'vitest';
import { buildArchiveSortHref, selectArchivePage } from './archive-filter';
import type { SortableArchiveGroup } from '@/components/ContentArchiveMarkup';

const groups: SortableArchiveGroup[] = [{ year: '2026', items: Array.from({ length: 25 }, (_, i) => ({ id: String(i), title: `文章 ${i}`, href: `/posts/${i}`, pinned: false, dateLabel: '09-10', dateTime: '2026-09-10', statsLabel: '', taxonomyItems: [{ href: '/tags/java', label: i % 2 ? 'Java' : 'React' }] })) }];
test('paginates filtered articles without dropping the last page or changing order', () => {
  expect(selectArchivePage(groups, { page: 3 }).groups[0]?.items.map(i => i.id)).toEqual(['24']);
  expect(selectArchivePage(groups, { tag: 'Java' }).total).toBe(12);
  expect(selectArchivePage(groups, { query: '文章 2' }).total).toBe(6);
  expect(selectArchivePage(groups, { page: -1 }).page).toBe(1);
  expect(selectArchivePage(groups, { page: 99 }).page).toBe(3);
  expect(selectArchivePage(groups, { query: 'missing' })).toEqual({ groups: [], page: 1, pages: 1, total: 0 });
});
test('changing sort keeps query and taxonomy filters while resetting pagination', () => {
  expect(buildArchiveSortHref('/posts', 'popular', 'voice', 'Agent')).toBe('/posts?sort=popular&q=voice&tag=Agent');
  expect(buildArchiveSortHref('/posts', 'latest', '', '')).toBe('/posts');
});
