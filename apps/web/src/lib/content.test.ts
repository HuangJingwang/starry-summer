import { describe, expect, test } from 'vitest';

import {
  getContentBySlug,
  getContentHref,
  getAdjacentContent,
  canShowComments,
  getCategoryHref,
  getContentByCategorySlug,
  getContentTaxonomyLinkGroups,
  getContentTaxonomyGroups,
  groupContentByMonth,
  getFeaturedContent,
  getContentBySeriesSlug,
  getContentByTagSlug,
  getPopularContent,
  getPublicContent,
  getSeriesHref,
  getTagHref,
  getSiteStats,
  groupContentByCategory,
  groupContentCounts,
  groupContentBySeries,
  groupContentByTag,
  normalizeContentSort,
  estimateReadingTime,
  searchContent,
} from './content';

describe('web content helpers', () => {
  test('filters public content and sorts newest first', () => {
    const visible = getPublicContent([
      { id: '1', title: 'Old', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-01-01' },
      { id: '2', title: 'Draft', type: 'post', status: 'draft', visibility: 'public', publishedAt: '2026-06-01' },
      { id: '3', title: 'New', type: 'note', status: 'published', visibility: 'public', publishedAt: '2026-05-01' },
      { id: '4', title: 'Private', type: 'post', status: 'published', visibility: 'private', publishedAt: '2026-04-01' },
      { id: '5', title: 'Pinned', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-02-01', pinned: true },
    ]);

    expect(visible.map((item) => item.id)).toEqual(['5', '3', '1']);
  });

  test('filters public content and sorts popular first', () => {
    const visible = getPublicContent(
      [
        { id: 'newer', title: 'Newer', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-06-10', viewCount: 5, likeCount: 1 },
        { id: 'popular', title: 'Popular', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-06-09', viewCount: 200, likeCount: 10 },
        { id: 'pinned', title: 'Pinned', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-06-08', viewCount: 1, likeCount: 0, pinned: true },
        { id: 'draft', title: 'Draft', type: 'post', status: 'draft', visibility: 'public', publishedAt: '2026-06-11', viewCount: 999, likeCount: 999 },
      ],
      'post',
      'popular',
    );

    expect(visible.map((item) => item.id)).toEqual(['pinned', 'popular', 'newer']);
  });

  test('normalizes content sort values for public pages', () => {
    expect(normalizeContentSort('popular')).toBe('popular');
    expect(normalizeContentSort('latest')).toBe('latest');
    expect(normalizeContentSort('unknown')).toBe('latest');
  });

  test('shows comment forms only for commentable content with comments enabled', () => {
    const base = {
      id: '1',
      title: 'A',
      status: 'published' as const,
      visibility: 'public' as const,
      publishedAt: '2026-01-01',
    };

    expect(canShowComments({ ...base, type: 'post' })).toBe(true);
    expect(canShowComments({ ...base, type: 'note' })).toBe(true);
    expect(canShowComments({ ...base, type: 'project' })).toBe(true);
    expect(canShowComments({ ...base, type: 'post', allowComments: false })).toBe(false);
    expect(canShowComments({ ...base, type: 'moment' })).toBe(false);
    expect(canShowComments({ ...base, type: 'page' })).toBe(false);
  });

  test('estimates reading time from mixed Chinese and English content', () => {
    expect(estimateReadingTime('短文')).toBe('1 min read');
    expect(estimateReadingTime('word '.repeat(401))).toBe('3 min read');
    expect(estimateReadingTime('中文'.repeat(260))).toBe('3 min read');
  });

  test('builds detail taxonomy groups from categories and tags', () => {
    expect(
      getContentTaxonomyGroups({
        categories: ['Writing', ' ', 'Writing'],
        tags: ['Next.js', 'Platform', 'Next.js'],
      }),
    ).toEqual([
      { label: '分类', ariaLabel: 'Categories', items: ['Writing'] },
      { label: '标签', ariaLabel: 'Tags', items: ['Next.js', 'Platform'] },
    ]);
  });

  test('builds detail taxonomy link groups for categories and tags', () => {
    expect(
      getContentTaxonomyLinkGroups({
        categories: ['Writing'],
        tags: ['Next.js'],
      }),
    ).toEqual([
      {
        label: '分类',
        ariaLabel: 'Categories',
        items: [{ label: 'Writing', href: '/categories/writing' }],
      },
      {
        label: '标签',
        ariaLabel: 'Tags',
        items: [{ label: 'Next.js', href: '/tags/next-js' }],
      },
    ]);
  });

  test('returns featured content before regular content', () => {
    const featured = getFeaturedContent([
      { id: '1', title: 'Regular', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-06-01' },
      { id: '2', title: 'Featured', type: 'project', status: 'published', visibility: 'public', publishedAt: '2026-01-01', featured: true },
    ]);

    expect(featured[0]?.id).toBe('2');
  });

  test('returns popular public content while excluding already featured records', () => {
    const popular = getPopularContent(
      [
        {
          id: 'featured',
          title: 'Featured Popular',
          type: 'post',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-01',
          featured: true,
          viewCount: 500,
          likeCount: 50,
        },
        {
          id: 'popular',
          title: 'Popular',
          type: 'note',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-02',
          viewCount: 120,
          likeCount: 12,
        },
        {
          id: 'quiet',
          title: 'Quiet',
          type: 'project',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-03',
          viewCount: 5,
          likeCount: 1,
        },
        {
          id: 'draft',
          title: 'Draft',
          type: 'post',
          status: 'draft',
          visibility: 'public',
          publishedAt: '2026-06-04',
          viewCount: 999,
          likeCount: 999,
        },
      ],
      { excludeIds: ['featured'], limit: 1 },
    );

    expect(popular.map((item) => item.id)).toEqual(['popular']);
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

  test('summarizes public site statistics from visible content', () => {
    expect(
      getSiteStats([
        {
          id: 'post',
          title: 'Post',
          type: 'post',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-10',
          viewCount: 20,
          likeCount: 3,
        },
        {
          id: 'note',
          title: 'Note',
          type: 'note',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-12',
          viewCount: 5,
          likeCount: 2,
        },
        {
          id: 'draft',
          title: 'Draft',
          type: 'post',
          status: 'draft',
          visibility: 'public',
          publishedAt: '2026-06-13',
          viewCount: 999,
          likeCount: 999,
        },
      ]),
    ).toEqual({
      publicCount: 2,
      totalViews: 25,
      totalLikes: 5,
      lastPublishedAt: '2026-06-12',
    });
  });

  test('searches public title summary taxonomy and body text', () => {
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
          categories: ['Platform'],
          series: ['Cloud Journal'],
          bodyMarkdown: 'Deployment notes for a personal cloud server.',
        },
      ],
      'cloud server',
    );

    expect(results.map((item) => item.id)).toEqual(['3']);
  });

  test('searches public content by SEO title and description', () => {
    const results = searchContent(
      [
        {
          id: 'seo-match',
          title: 'Launch Notes',
          type: 'post',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-10',
          seoTitle: 'Search Console Checklist',
          seoDescription: 'Canonical deployment checklist',
        },
        {
          id: 'miss',
          title: 'Unrelated',
          type: 'note',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-09',
        },
      ],
      'canonical deployment',
    );

    expect(results.map((item) => item.id)).toEqual(['seo-match']);
  });

  test('searches public content by series labels', () => {
    const results = searchContent(
      [
        {
          id: 'series-post',
          title: 'Entry 1',
          type: 'post',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-10',
          series: ['Platform Journal'],
        },
      ],
      'platform journal',
    );

    expect(results.map((item) => item.id)).toEqual(['series-post']);
  });

  test('ranks title matches before taxonomy and body matches', () => {
    const results = searchContent(
      [
        {
          id: 'body',
          title: 'Deployment Note',
          type: 'note',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-12',
          bodyMarkdown: 'This note mentions PostgreSQL in the body.',
        },
        {
          id: 'category',
          title: 'Database Work',
          type: 'post',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-11',
          categories: ['PostgreSQL'],
        },
        {
          id: 'title',
          title: 'PostgreSQL Backup Plan',
          type: 'project',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-10',
        },
      ],
      'postgresql',
    );

    expect(results.map((item) => item.id)).toEqual(['title', 'category', 'body']);
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

  test('groups public content by category newest first', () => {
    const groups = groupContentByCategory([
      {
        id: 'old',
        title: 'Old',
        type: 'post',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-01-01',
        categories: ['Writing', 'System'],
      },
      {
        id: 'new',
        title: 'New',
        type: 'note',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-02-01',
        categories: ['Writing'],
      },
      {
        id: 'draft',
        title: 'Draft',
        type: 'post',
        status: 'draft',
        visibility: 'public',
        publishedAt: '2026-03-01',
        categories: ['Writing'],
      },
      {
        id: 'private',
        title: 'Private',
        type: 'project',
        status: 'published',
        visibility: 'private',
        publishedAt: '2026-04-01',
        categories: ['Lab'],
      },
    ]);

    expect(groups).toEqual([
      {
        key: 'writing',
        label: 'Writing',
        items: [expect.objectContaining({ id: 'new' }), expect.objectContaining({ id: 'old' })],
      },
      {
        key: 'system',
        label: 'System',
        items: [expect.objectContaining({ id: 'old' })],
      },
    ]);
  });

  test('finds public content by category slug', () => {
    const items = [
      {
        id: 'one',
        title: 'One',
        type: 'post' as const,
        status: 'published' as const,
        visibility: 'public' as const,
        publishedAt: '2026-01-01',
        categories: ['Writing Notes'],
      },
    ];

    expect(getContentByCategorySlug(items, 'writing-notes')?.items.map((item) => item.id)).toEqual(['one']);
    expect(getContentByCategorySlug(items, 'missing')).toBeNull();
    expect(getCategoryHref('Writing Notes')).toBe('/categories/writing-notes');
  });

  test('groups public content by series newest first', () => {
    const groups = groupContentBySeries([
      {
        id: 'old',
        title: 'Old',
        type: 'post',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-01-01',
        series: ['Platform Journal', 'Build Log'],
      },
      {
        id: 'new',
        title: 'New',
        type: 'note',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-02-01',
        series: ['Platform Journal'],
      },
      {
        id: 'draft',
        title: 'Draft',
        type: 'post',
        status: 'draft',
        visibility: 'public',
        publishedAt: '2026-03-01',
        series: ['Platform Journal'],
      },
    ]);

    expect(groups).toEqual([
      {
        key: 'platform-journal',
        label: 'Platform Journal',
        items: [expect.objectContaining({ id: 'new' }), expect.objectContaining({ id: 'old' })],
      },
      {
        key: 'build-log',
        label: 'Build Log',
        items: [expect.objectContaining({ id: 'old' })],
      },
    ]);
  });

  test('groups public content by tag newest first', () => {
    const groups = groupContentByTag([
      {
        id: 'old',
        title: 'Old',
        type: 'post',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-01-01',
        tags: ['Next.js', 'Platform'],
      },
      {
        id: 'new',
        title: 'New',
        type: 'note',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-02-01',
        tags: ['Next.js'],
      },
      {
        id: 'private',
        title: 'Private',
        type: 'project',
        status: 'published',
        visibility: 'private',
        publishedAt: '2026-03-01',
        tags: ['Next.js'],
      },
    ]);

    expect(groups).toEqual([
      {
        key: 'next-js',
        label: 'Next.js',
        items: [expect.objectContaining({ id: 'new' }), expect.objectContaining({ id: 'old' })],
      },
      {
        key: 'platform',
        label: 'Platform',
        items: [expect.objectContaining({ id: 'old' })],
      },
    ]);
  });

  test('finds public content by series slug', () => {
    const items = [
      {
        id: 'one',
        title: 'One',
        type: 'post' as const,
        status: 'published' as const,
        visibility: 'public' as const,
        publishedAt: '2026-01-01',
        series: ['Platform Journal'],
      },
      {
        id: 'two',
        title: 'Two',
        type: 'note' as const,
        status: 'published' as const,
        visibility: 'public' as const,
        publishedAt: '2026-02-01',
        series: ['Other'],
      },
    ];

    expect(getContentBySeriesSlug(items, 'platform-journal')?.items.map((item) => item.id)).toEqual(['one']);
    expect(getContentBySeriesSlug(items, 'missing')).toBeNull();
    expect(getSeriesHref('Platform Journal')).toBe('/series/platform-journal');
  });

  test('finds public content by tag slug', () => {
    const items = [
      {
        id: 'one',
        title: 'One',
        type: 'post' as const,
        status: 'published' as const,
        visibility: 'public' as const,
        publishedAt: '2026-01-01',
        tags: ['Next.js'],
      },
    ];

    expect(getContentByTagSlug(items, 'next-js')?.items.map((item) => item.id)).toEqual(['one']);
    expect(getContentByTagSlug(items, 'missing')).toBeNull();
    expect(getTagHref('Next.js')).toBe('/tags/next-js');
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
