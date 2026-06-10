import { describe, expect, test } from 'vitest';

import {
  getContentBySlug,
  getContentHref,
  getAdjacentContent,
  groupContentByMonth,
  getFeaturedContent,
  getPublicContent,
  groupContentCounts,
  searchContent,
} from './content';

describe('web content helpers', () => {
  test('filters public content and sorts newest first', () => {
    const visible = getPublicContent([
      { id: '1', title: 'Old', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-01-01' },
      { id: '2', title: 'Draft', type: 'post', status: 'draft', visibility: 'public', publishedAt: '2026-06-01' },
      { id: '3', title: 'New', type: 'note', status: 'published', visibility: 'public', publishedAt: '2026-05-01' },
      { id: '4', title: 'Private', type: 'post', status: 'published', visibility: 'private', publishedAt: '2026-04-01' },
    ]);

    expect(visible.map((item) => item.id)).toEqual(['3', '1']);
  });

  test('returns featured content before regular content', () => {
    const featured = getFeaturedContent([
      { id: '1', title: 'Regular', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-06-01' },
      { id: '2', title: 'Featured', type: 'project', status: 'published', visibility: 'public', publishedAt: '2026-01-01', featured: true },
    ]);

    expect(featured[0]?.id).toBe('2');
  });

  test('groups counts by content type', () => {
    expect(
      groupContentCounts([
        { id: '1', title: 'A', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-01-01' },
        { id: '2', title: 'B', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-01-02' },
        { id: '3', title: 'C', type: 'moment', status: 'published', visibility: 'public', publishedAt: '2026-01-03' },
      ]),
    ).toEqual({ moment: 1, note: 0, page: 0, post: 2, project: 0 });
  });

  test('searches public title summary and tags only', () => {
    const results = searchContent(
      [
        {
          id: '1',
          title: 'Public Markdown Note',
          type: 'note',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-01-01',
          tags: ['Archive'],
        },
        {
          id: '2',
          title: 'Private Markdown Draft',
          type: 'post',
          status: 'draft',
          visibility: 'public',
          publishedAt: '2026-01-02',
          tags: ['Archive'],
        },
        {
          id: '3',
          title: 'Project',
          type: 'project',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-01-03',
          summary: 'Built with Next.js',
        },
      ],
      'archive',
    );

    expect(results.map((item) => item.id)).toEqual(['1']);
  });

  test('builds public content hrefs', () => {
    expect(
      getContentHref({
        id: '1',
        title: 'A',
        type: 'post',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-01-01',
        slug: 'a',
      }),
    ).toBe('/posts/a');
    expect(
      getContentHref({
        id: '2',
        title: 'About',
        type: 'page',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-01-01',
        slug: 'about',
      }),
    ).toBe('/about');
  });

  test('finds public content by type and slug', () => {
    const item = getContentBySlug(
      [
        { id: '1', title: 'A', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-01-01', slug: 'a' },
        { id: '2', title: 'B', type: 'post', status: 'draft', visibility: 'public', publishedAt: '2026-01-02', slug: 'b' },
      ],
      'post',
      'a',
    );

    expect(item?.id).toBe('1');
    expect(getContentBySlug([], 'post', 'missing')).toBeNull();
  });

  test('groups public content into archive months', () => {
    const groups = groupContentByMonth([
      { id: '1', title: 'A', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-06-10' },
      { id: '2', title: 'B', type: 'note', status: 'published', visibility: 'public', publishedAt: '2026-06-01' },
      { id: '3', title: 'C', type: 'project', status: 'published', visibility: 'public', publishedAt: '2026-05-30' },
      { id: '4', title: 'Draft', type: 'post', status: 'draft', visibility: 'public', publishedAt: '2026-06-20' },
    ]);

    expect(groups).toEqual([
      { key: '2026-06', label: '2026 年 06 月', items: expect.arrayContaining([expect.objectContaining({ id: '1' }), expect.objectContaining({ id: '2' })]) },
      { key: '2026-05', label: '2026 年 05 月', items: [expect.objectContaining({ id: '3' })] },
    ]);
  });

  test('finds adjacent public content in timeline order', () => {
    const adjacent = getAdjacentContent(
      [
        { id: 'old', title: 'Old', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-01-01', slug: 'old' },
        { id: 'current', title: 'Current', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-02-01', slug: 'current' },
        { id: 'new', title: 'New', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-03-01', slug: 'new' },
      ],
      'current',
    );

    expect(adjacent.previous?.id).toBe('old');
    expect(adjacent.next?.id).toBe('new');
  });
});
