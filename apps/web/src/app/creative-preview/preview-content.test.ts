import { describe, expect, test } from 'vitest';

import type { SiteContentItem } from '@/lib/content-types';

import { selectPreviewContent } from './preview-content';

function entry(id: string, overrides: Partial<SiteContentItem> = {}): SiteContentItem {
  return { id, title: id, slug: id, type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-09-01', ...overrides };
}

describe('blog preview content selection', () => {
  test('keeps private content and standalone pages out of every discovery surface', () => {
    const selection = selectPreviewContent([
      entry('article'),
      entry('draft', { status: 'draft' }),
      entry('private', { visibility: 'private' }),
      entry('about', { type: 'page' }),
      entry('project', { type: 'project', coverImageUrl: '/project.webp' }),
    ]);

    expect(selection.publicCount).toBe(2);
    expect(selection.featuredEntries.map((item) => item.id)).toEqual(['article']);
    expect(selection.galleryEntries.map((item) => item.id)).toEqual(['article', 'project']);
    expect(selection.recentEntries.map((item) => item.id).sort()).toEqual(['article', 'project']);
  });

  test('sorts recent entries by publication date even when an older entry is pinned, without changing the input', () => {
    const content = [entry('pinned', { pinned: true, publishedAt: '2026-01-01' }), entry('new', { publishedAt: '2026-09-09' }), entry('note', { type: 'note', publishedAt: '2026-09-08' })];
    const selection = selectPreviewContent(content);

    expect(selection.lastPublishedAt).toBe('2026-09-09');
    expect(selection.featuredEntries.map((item) => item.id)).toEqual(['new', 'note', 'pinned']);
    expect(content.map((item) => item.id)).toEqual(['pinned', 'new', 'note']);
    expect(selectPreviewContent([])).toEqual({ featuredEntries: [], galleryEntries: [], recentEntries: [], publicCount: 0, lastPublishedAt: '' });
  });
});
