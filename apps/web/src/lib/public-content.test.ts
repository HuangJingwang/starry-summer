import { describe, expect, test } from 'vitest';

import {
  buildPublicContentListRequest,
  loadPublicContentItems,
  normalizePublicContentItem,
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
    expect(buildPublicContentListRequest({ apiBaseUrl: 'https://api.example.com' })).toEqual({
      url: 'https://api.example.com/content',
      init: {
        method: 'GET',
        next: {
          revalidate: 60,
        },
      },
    });
    expect(buildPublicContentListRequest({ apiBaseUrl: 'https://api.example.com/', type: 'post' }).url).toBe(
      'https://api.example.com/content?type=post',
    );
    expect(buildPublicContentListRequest({ apiBaseUrl: 'https://api.example.com/', type: 'post', sort: 'popular' }).url).toBe(
      'https://api.example.com/content?type=post&sort=popular',
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
      fetcher: async () =>
        new Response(
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
        ),
    });

    expect(result.source).toBe('api');
    expect(result.items.map((item) => item.id)).toEqual(['api-note']);
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
});
