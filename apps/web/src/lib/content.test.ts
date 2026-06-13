import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  seedContent,
  getContentBySlug,
  getContentHref,
  getAdjacentContent,
  canShowComments,
  formatPublicContentType,
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
  buildSearchResultPreviews,
  normalizeSearchContentKind,
  splitHighlightedSearchText,
  searchContent,
} from './content';
import { DEFAULT_POST_COVER } from './content-cover';

describe('web content helpers', () => {
  test('keeps public content helpers split into focused modules behind a stable barrel', () => {
    const modulePaths = [
      'src/lib/content-types.ts',
      'src/lib/content-public.ts',
      'src/lib/content-taxonomy.ts',
      'src/lib/content-search.ts',
      'src/lib/content-seed.ts',
    ];
    const barrel = readFileSync(join(process.cwd(), 'src/lib/content.ts'), 'utf8');

    for (const modulePath of modulePaths) {
      expect(readFileSync(join(process.cwd(), modulePath), 'utf8').length).toBeGreaterThan(0);
    }

    expect(barrel).toContain("export * from './content-types';");
    expect(barrel).toContain("export * from './content-public';");
    expect(barrel).toContain("export * from './content-taxonomy';");
    expect(barrel).toContain("export * from './content-search';");
    expect(barrel).toContain("export * from './content-seed';");
    expect(barrel.split('\n')).toHaveLength(6);
  });

  test('uses the default post cover for seed featured items instead of the home workspace image', () => {
    const seedFeaturedCovers = seedContent
      .filter((item) => item.featured && ['intro-post', 'project-starry'].includes(item.id))
      .map((item) => item.coverImageUrl);

    expect(seedFeaturedCovers).toEqual([DEFAULT_POST_COVER.imageUrl, DEFAULT_POST_COVER.imageUrl]);
    expect(seedContent.some((item) => item.coverImageUrl === '/hero-workspace.png')).toBe(false);
  });

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

  test('treats posts and notes as one public article stream', () => {
    const visible = getPublicContent(
      [
        { id: 'post', title: 'Post', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-06-10' },
        { id: 'note', title: 'Note', type: 'note', status: 'published', visibility: 'public', publishedAt: '2026-06-11' },
        { id: 'moment', title: 'Moment', type: 'moment', status: 'published', visibility: 'public', publishedAt: '2026-06-12' },
      ],
      'article',
    );

    expect(visible.map((item) => item.id)).toEqual(['note', 'post']);
  });

  test('formats notes as articles for public pages', () => {
    expect(formatPublicContentType('post')).toBe('文章');
    expect(formatPublicContentType('note')).toBe('文章');
    expect(formatPublicContentType('moment')).toBe('日常');
    expect(formatPublicContentType('project')).toBe('项目');
    expect(formatPublicContentType('page')).toBe('页面');
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
    expect(estimateReadingTime('短文')).toBe('1 分钟阅读');
    expect(estimateReadingTime('word '.repeat(401))).toBe('3 分钟阅读');
    expect(estimateReadingTime('中文'.repeat(260))).toBe('3 分钟阅读');
  });

  test('builds detail taxonomy groups from categories and tags', () => {
    expect(
      getContentTaxonomyGroups({
        categories: ['Writing', ' ', 'Writing'],
        tags: ['Next.js', 'Platform', 'Next.js'],
      }),
    ).toEqual([
      { label: '分类', ariaLabel: '分类', items: ['Writing'] },
      { label: '标签', ariaLabel: '标签', items: ['Next.js', 'Platform'] },
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
        ariaLabel: '分类',
        items: [{ label: 'Writing', href: '/categories/writing' }],
      },
      {
        label: '标签',
        ariaLabel: '标签',
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

  test('normalizes search content kind filters for the public search page', () => {
    expect(normalizeSearchContentKind('article')).toBe('article');
    expect(normalizeSearchContentKind('moment')).toBe('moment');
    expect(normalizeSearchContentKind('project')).toBe('project');
    expect(normalizeSearchContentKind('all')).toBe('all');
    expect(normalizeSearchContentKind('page')).toBe('all');
    expect(normalizeSearchContentKind(undefined)).toBe('all');
  });

  test('builds search result previews with snippets and matched fields', () => {
    const previews = buildSearchResultPreviews(
      [
        {
          id: 'title',
          title: 'PostgreSQL Backup Plan',
          type: 'post',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-10',
          summary: 'A quiet deployment checklist.',
          bodyMarkdown: 'Nightly database snapshots and restore drills.',
        },
        {
          id: 'body',
          title: 'Deployment Note',
          type: 'note',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-09',
          categories: ['Ops'],
          bodyMarkdown: 'This note explains PostgreSQL restore practice for a personal archive.',
        },
      ],
      'postgresql restore',
    );

    expect(previews).toEqual([
      {
        item: expect.objectContaining({ id: 'body' }),
        snippet: expect.stringContaining('PostgreSQL restore practice'),
        matchedFields: ['正文'],
      },
    ]);
  });

  test('splits highlighted search text without losing surrounding copy', () => {
    expect(splitHighlightedSearchText('Personal PostgreSQL restore practice', 'postgresql restore')).toEqual([
      { text: 'Personal ', highlighted: false },
      { text: 'PostgreSQL', highlighted: true },
      { text: ' ', highlighted: false },
      { text: 'restore', highlighted: true },
      { text: ' practice', highlighted: false },
    ]);
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
        id: 'note-1',
        title: 'Note',
        type: 'note',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-01-01',
        slug: 'note-a',
      }),
    ).toBe('/posts/note-a');
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

  test('finds notes through the article slug lookup', () => {
    const item = getContentBySlug(
      [
        { id: '1', title: 'A', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-01-01', slug: 'a' },
        { id: '2', title: 'B', type: 'note', status: 'published', visibility: 'public', publishedAt: '2026-01-02', slug: 'b' },
      ],
      'article',
      'b',
    );

    expect(item?.id).toBe('2');
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

  test('finds adjacent content within the merged article stream', () => {
    const adjacent = getAdjacentContent(
      [
        { id: 'old-post', title: 'Old Post', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-01-01', slug: 'old-post' },
        { id: 'near-note', title: 'Near Note', type: 'note', status: 'published', visibility: 'public', publishedAt: '2026-01-15', slug: 'near-note' },
        { id: 'current-post', title: 'Current Post', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-02-01', slug: 'current-post' },
        { id: 'near-project', title: 'Near Project', type: 'project', status: 'published', visibility: 'public', publishedAt: '2026-02-15', slug: 'near-project' },
        { id: 'new-post', title: 'New Post', type: 'post', status: 'published', visibility: 'public', publishedAt: '2026-03-01', slug: 'new-post' },
      ],
      'current-post',
    );

    expect(adjacent.previous?.id).toBe('near-note');
    expect(adjacent.next?.id).toBe('new-post');
  });
});
