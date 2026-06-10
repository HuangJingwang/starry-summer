import { describe, expect, test } from 'vitest';

import { createMarkdownPreview, filterAdminContent, getAdminContentStats } from './admin-content';
import type { SiteContentItem } from './content';

const items: SiteContentItem[] = [
  {
    id: 'draft-post',
    title: 'Draft Post',
    type: 'post',
    status: 'draft',
    visibility: 'public',
    publishedAt: '2026-06-10',
    summary: 'A draft',
    tags: ['Writing'],
  },
  {
    id: 'published-note',
    title: 'Published Note',
    type: 'note',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-09',
    summary: 'A note',
    tags: ['Archive'],
  },
  {
    id: 'private-project',
    title: 'Private Project',
    type: 'project',
    status: 'published',
    visibility: 'private',
    publishedAt: '2026-06-08',
    summary: 'Private work',
    tags: ['Lab'],
  },
];

describe('admin content helpers', () => {
  test('counts all admin-visible content by status and visibility', () => {
    expect(getAdminContentStats(items)).toEqual({
      total: 3,
      draft: 1,
      published: 2,
      private: 1,
      archived: 0,
    });
  });

  test('filters content by type status and search text', () => {
    expect(filterAdminContent(items, { type: 'note' }).map((item) => item.id)).toEqual(['published-note']);
    expect(filterAdminContent(items, { status: 'draft' }).map((item) => item.id)).toEqual(['draft-post']);
    expect(filterAdminContent(items, { query: 'lab' }).map((item) => item.id)).toEqual(['private-project']);
  });

  test('creates a readable Markdown preview model', () => {
    const preview = createMarkdownPreview('# Hello\n\nThis is a first paragraph with useful context.');

    expect(preview.title).toBe('Hello');
    expect(preview.excerpt).toBe('This is a first paragraph with useful context.');
    expect(preview.wordCount).toBe(9);
  });
});
