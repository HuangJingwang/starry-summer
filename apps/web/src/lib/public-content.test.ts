import { describe, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  buildPublicContentListRequest,
  loadRepositoryContentItems,
  loadPublicContentItems,
  loadSiteContent,
  normalizePublicContentItem,
  readRepositoryContentFile,
} from './public-content';
import type { SiteContentItem } from './content';

const fallbackItems: SiteContentItem[] = [
  {
    id: 'post-1',
    title: 'Fallback Post',
    type: 'post',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-10',
    slug: 'fallback-post',
  },
  {
    id: 'note-1',
    title: 'Fallback Note',
    type: 'note',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-09',
    slug: 'fallback-note',
  },
];

describe('public content API helpers', () => {
  test('builds public content list requests', () => {
    expect(buildPublicContentListRequest()).toBeNull();
    expect(buildPublicContentListRequest({ apiBaseUrl: 'https://api.example.com' })).toEqual({
      url: 'https://api.example.com/content',
      init: {
        method: 'GET',
        next: {
          revalidate: 60,
        },
      },
    });
    expect(buildPublicContentListRequest({ apiBaseUrl: 'https://api.example.com/', type: 'post' })?.url).toBe(
      'https://api.example.com/content?type=post',
    );
    expect(buildPublicContentListRequest({ apiBaseUrl: 'https://api.example.com/', type: 'post', sort: 'popular' })?.url).toBe(
      'https://api.example.com/content?type=post&sort=popular',
    );
    expect(buildPublicContentListRequest({ apiBaseUrl: 'https://api.example.com/', type: 'article' })?.url).toBe(
      'https://api.example.com/content',
    );
    expect(buildPublicContentListRequest({ apiBaseUrl: 'https://api.example.com/', query: ' cloud backup ' })?.url).toBe(
      'https://api.example.com/content?q=cloud+backup',
    );
  });

  test('normalizes API content records for public pages', () => {
    expect(
      normalizePublicContentItem({
        id: 'api-post',
        type: 'post',
        title: 'API Post',
        slug: 'api-post',
        summary: 'From API',
        seoTitle: 'API Post SEO',
        seoDescription: 'API search description',
        status: 'published',
        visibility: 'public',
        featured: true,
        pinned: true,
        sourceType: 'repost',
        sourceUrl: 'https://example.com/original',
        coverAssetId: 'asset-1',
        coverImageUrl: '/uploads/cover.png',
        coverAltText: 'Cover image',
        categories: ['Writing'],
        tags: ['API'],
        series: ['Build Log'],
        bodyMarkdown: '# API Post\n\nFull body.',
        allowComments: false,
        viewCount: 12,
        likeCount: 3,
        project: {
          status: 'completed',
          links: {
            website: 'https://example.com',
            demo: 'https://demo.example.com',
          },
          stack: ['Next.js', 'NestJS'],
          startedAt: '2025-01-01',
          endedAt: '2026-01-01',
        },
        updatedAt: '2026-06-10T01:00:00.000Z',
        publishedAt: '2026-06-10T00:00:00.000Z',
      } as any),
    ).toEqual({
      id: 'api-post',
      type: 'post',
      title: 'API Post',
      slug: 'api-post',
      summary: 'From API',
      seoTitle: 'API Post SEO',
      seoDescription: 'API search description',
      status: 'published',
      visibility: 'public',
      featured: true,
      pinned: true,
      sourceType: 'repost',
      sourceUrl: 'https://example.com/original',
      coverAssetId: 'asset-1',
      coverImageUrl: '/uploads/cover.png',
      coverAltText: 'Cover image',
      categories: ['Writing'],
      tags: ['API'],
      series: ['Build Log'],
      bodyMarkdown: '# API Post\n\nFull body.',
      allowComments: false,
      viewCount: 12,
      likeCount: 3,
      updatedAt: '2026-06-10',
      project: {
        status: 'completed',
        links: {
          website: 'https://example.com',
          demo: 'https://demo.example.com',
        },
        stack: ['Next.js', 'NestJS'],
        startedAt: '2025-01-01',
        endedAt: '2026-01-01',
      },
      publishedAt: '2026-06-10',
    });
  });

  test('loads public content records from the API', async () => {
    const result = await loadPublicContentItems(fallbackItems, {
      apiBaseUrl: 'https://api.example.com',
      fetcher: async (_url, init) => {
        expect(init.signal).toBeInstanceOf(AbortSignal);

        return new Response(
          JSON.stringify([
            {
              id: 'api-note',
              type: 'note',
              title: 'API Note',
              slug: 'api-note',
              status: 'published',
              visibility: 'public',
              updatedAt: '2026-06-10T00:00:00.000Z',
            },
          ]),
        );
      },
    });

    expect(result.source).toBe('api');
    expect(result.items.map((item) => item.id)).toEqual(['api-note']);
  });

  test('uses fallback content during server render when no API base URL is configured', async () => {
    const result = await loadPublicContentItems(fallbackItems);

    expect(result).toEqual({
      source: 'fallback',
      items: fallbackItems,
    });
  });

  test('loads article fallback content from both posts and notes', async () => {
    const result = await loadPublicContentItems(fallbackItems, { type: 'article' });

    expect(result.items.map((item) => item.id)).toEqual(['post-1', 'note-1']);
  });

  test('falls back when a public content request times out', async () => {
    const result = await loadPublicContentItems(fallbackItems, {
      apiBaseUrl: 'https://api.example.com',
      timeoutMs: 1,
      fetcher: (_url, init) =>
        new Promise<Response>((resolve) => {
          init.signal?.addEventListener('abort', () => resolve(new Response('Aborted', { status: 408 })));
        }),
    });

    expect(result).toEqual({
      source: 'fallback',
      items: fallbackItems,
    });
  });

  test('falls back to public seed content when the API is unavailable', async () => {
    const result = await loadPublicContentItems(fallbackItems, {
      type: 'post',
      fetcher: async () => new Response('Unavailable', { status: 503 }),
    });

    expect(result).toEqual({
      source: 'fallback',
      items: [fallbackItems[0]],
    });
  });

  test('falls back with the requested public content sort order', async () => {
    const basePost: SiteContentItem = {
      id: 'base',
      title: 'Base Post',
      type: 'post',
      status: 'published',
      visibility: 'public',
      publishedAt: '2026-06-01',
      slug: 'base-post',
    };

    const result = await loadPublicContentItems(
      [
        { ...basePost, id: 'newer', publishedAt: '2026-06-10', viewCount: 1, likeCount: 1 },
        { ...basePost, id: 'popular', publishedAt: '2026-06-09', viewCount: 100, likeCount: 10 },
      ],
      {
        type: 'post',
        sort: 'popular',
        fetcher: async () => new Response('Unavailable', { status: 503 }),
      },
    );

    expect(result.items.map((item) => item.id)).toEqual(['popular', 'newer']);
  });

  test('falls back with the requested public content search query', async () => {
    const basePost: SiteContentItem = {
      id: 'base',
      title: 'Base Post',
      type: 'post',
      status: 'published',
      visibility: 'public',
      publishedAt: '2026-06-01',
      slug: 'base-post',
    };

    const result = await loadPublicContentItems(
      [
        { ...basePost, id: 'match', title: 'Cloud Backup Plan', summary: 'PostgreSQL notes' },
        { ...basePost, id: 'miss', title: 'Garden Notes', summary: 'Unrelated' },
      ],
      {
        query: 'cloud postgresql',
        fetcher: async () => new Response('Unavailable', { status: 503 }),
      },
    );

    expect(result.items.map((item) => item.id)).toEqual(['match']);
  });

  test('loads public content from a repository-owned JSON file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'starry-content-'));
    const contentFilePath = join(directory, 'public-content.json');

    writeFileSync(
      contentFilePath,
      JSON.stringify([
        {
          id: 'file-post',
          title: 'File Post',
          type: 'post',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-12T08:00:00.000Z',
          summary: 'Stored in Git-friendly JSON.',
          slug: 'file-post',
          tags: ['GitHub'],
        },
        {
          id: 'draft-post',
          title: 'Draft Post',
          type: 'post',
          status: 'draft',
          visibility: 'private',
          publishedAt: '2026-06-12',
          slug: 'draft-post',
        },
      ]),
      'utf8',
    );

    expect(readRepositoryContentFile(contentFilePath)).toEqual([
      expect.objectContaining({
        id: 'file-post',
        publishedAt: '2026-06-12',
        sourceType: 'original',
        allowComments: true,
        viewCount: 0,
        likeCount: 0,
      }),
      expect.objectContaining({ id: 'draft-post' }),
    ]);

    await expect(loadRepositoryContentItems({ contentFilePath })).resolves.toEqual({
      source: 'repository-file',
      items: [expect.objectContaining({ id: 'file-post' })],
    });
  });

  test('uses repository content as the default public site source', async () => {
    const content = await loadSiteContent('article');
    const introPost = content.find((item) => item.id === 'intro-post');

    expect(introPost).toMatchObject({
      id: 'intro-post',
      status: 'published',
      visibility: 'public',
      sourceType: 'original',
    });
    expect(introPost?.bodyMarkdown).toContain('[Pigs-blog](https://github.com/Aster-H/Pigs-blog/tree/dev/server)');
    expect(introPost?.bodyMarkdown).not.toContain('HuangJingwang');

    const studyPost = content.find((item) => item.slug === 'juejin-7615915954711691304');
    expect(studyPost?.bodyMarkdown).toContain('[github.com/Aster-H/leetforge](https://github.com/Aster-H/leetforge)');
    expect(studyPost?.bodyMarkdown).not.toContain('HuangJingwang');
  });

  test('reuses unchanged repository content instead of reparsing it on every route render', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'starry-content-cache-'));
    const contentFilePath = join(directory, 'public-content.json');

    writeFileSync(
      contentFilePath,
      JSON.stringify([
        {
          id: 'cached-post',
          title: 'Cached Post',
          type: 'post',
          status: 'published',
          visibility: 'public',
          publishedAt: '2026-06-12',
          slug: 'cached-post',
        },
      ]),
      'utf8',
    );

    const first = await loadRepositoryContentItems({ contentFilePath, type: 'post' });
    const second = await loadRepositoryContentItems({ contentFilePath, type: 'post' });

    expect(first.items[0]?.title).toBe('Cached Post');
    expect(second.items[0]).toBe(first.items[0]);
  });

  test('includes selected GitHub repositories in project fallback content', async () => {
    const projects = await loadSiteContent('project');

    expect(projects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'project-starry',
          title: 'Starry Summer',
          coverImageUrl: '/images/projects/starry-summer-avatar.webp',
          coverAltText: 'Starry Summer 项目头像',
        }),
        expect.objectContaining({
          id: 'project-easy-yapi-micronaut',
          title: 'easy-yapi-micronaut',
          coverImageUrl: '/images/projects/easy-yapi-micronaut-avatar.webp',
          coverAltText: 'easy-yapi-micronaut 项目头像',
          project: expect.objectContaining({
            links: expect.objectContaining({
              repository: 'https://github.com/HuangJingwang/easy-yapi-micronaut',
            }),
            stack: expect.arrayContaining(['Kotlin', 'Micronaut', 'JDK21']),
          }),
        }),
        expect.objectContaining({
          id: 'project-brushup',
          title: 'brushup',
          coverImageUrl: '/images/projects/brushup-avatar.webp',
          coverAltText: 'brushup 项目头像',
          project: expect.objectContaining({
            links: expect.objectContaining({
              repository: 'https://github.com/HuangJingwang/brushup',
            }),
            stack: expect.arrayContaining(['Python', 'LeetCode', 'AI Code Review']),
          }),
        }),
      ]),
    );
  });

  test('does not keep a public API source switch for the site runtime', () => {
    const source = readFileSync(__filename.replace(/\.test\.ts$/, '.ts'), 'utf8');

    expect(source).not.toContain('PUBLIC_CONTENT_SOURCE');
    expect(source).not.toContain('process.env.API_BASE_URL');
    expect(source).toContain('loadRepositoryContentItems({ type, sort, query })');
  });
});
