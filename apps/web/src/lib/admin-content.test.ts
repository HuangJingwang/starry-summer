import { describe, expect, test } from 'vitest';

import {
  buildAdminContentActionRequest,
  buildCreateDraftRequest,
  buildContentPayloadFromFormData,
  buildListAdminContentRequest,
  buildUpdateContentRequest,
  createMarkdownPreview,
  filterAdminContent,
  getAdminContentStats,
  loadAdminContentItems,
  normalizeAdminContentItem,
  normalizeAdminContentSearchParams,
} from './admin-content';
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

  test('normalizes URL search params into valid admin content filters', () => {
    expect(normalizeAdminContentSearchParams({ q: ' api ', status: 'draft', type: 'post' })).toEqual({
      query: 'api',
      status: 'draft',
      type: 'post',
    });
    expect(normalizeAdminContentSearchParams({ q: 'x', status: 'deleted', type: 'article' })).toEqual({
      query: 'x',
    });
  });

  test('creates a readable Markdown preview model', () => {
    const preview = createMarkdownPreview('# Hello\n\nThis is a first paragraph with useful context.');

    expect(preview.title).toBe('Hello');
    expect(preview.excerpt).toBe('This is a first paragraph with useful context.');
    expect(preview.wordCount).toBe(9);
  });

  test('builds a normalized create draft request', () => {
    expect(
      buildCreateDraftRequest({
        title: ' New Post ',
        slug: 'New Post',
        type: 'post',
        summary: ' Summary ',
        bodyMarkdown: '# New Post',
        allowComments: true,
        pinned: false,
        featured: true,
      }),
    ).toEqual({
      url: '/api/admin/content',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Post',
          slug: 'new-post',
          type: 'post',
          summary: 'Summary',
          bodyMarkdown: '# New Post',
          allowComments: true,
          pinned: false,
          featured: true,
        }),
      },
    });
  });

  test('builds update and lifecycle action requests', () => {
    expect(buildUpdateContentRequest('content-1', { title: 'Saved', slug: 'saved' })).toMatchObject({
      url: '/api/admin/content/content-1',
      init: {
        method: 'PATCH',
        credentials: 'include',
      },
    });
    expect(buildAdminContentActionRequest('content-1', 'archive')).toEqual({
      url: '/api/admin/content/content-1/archive',
      init: {
        method: 'PATCH',
        credentials: 'include',
      },
    });
  });

  test('builds admin content list request', () => {
    expect(buildListAdminContentRequest()).toEqual({
      url: '/api/admin/content',
      init: {
        method: 'GET',
        credentials: 'include',
      },
    });
  });

  test('normalizes API content records for admin lists', () => {
    expect(
      normalizeAdminContentItem({
        id: 'content-1',
        type: 'post',
        title: 'Draft from API',
        slug: 'draft-from-api',
        summary: 'API summary',
        status: 'draft',
        visibility: 'public',
        featured: true,
        viewCount: 10,
        likeCount: 2,
        createdAt: '2026-06-09T00:00:00.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z',
        publishedAt: null,
      }),
    ).toEqual({
      id: 'content-1',
      type: 'post',
      title: 'Draft from API',
      slug: 'draft-from-api',
      summary: 'API summary',
      status: 'draft',
      visibility: 'public',
      featured: true,
      viewCount: 10,
      likeCount: 2,
      publishedAt: '2026-06-10',
      tags: [],
    });
  });

  test('loads admin content records from the API', async () => {
    const result = await loadAdminContentItems(items, async () => {
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
    });

    expect(result).toEqual({
      source: 'api',
      items: [
        {
          id: 'api-note',
          type: 'note',
          title: 'API Note',
          slug: 'api-note',
          summary: '',
          status: 'published',
          visibility: 'public',
          featured: false,
          viewCount: 0,
          likeCount: 0,
          publishedAt: '2026-06-10',
          tags: [],
        },
      ],
    });
  });

  test('falls back to provided content when admin content API is unavailable', async () => {
    const result = await loadAdminContentItems(items, async () => new Response('Unauthorized', { status: 401 }));

    expect(result).toEqual({
      source: 'fallback',
      items,
    });
  });

  test('reads content form data into an API payload', () => {
    const formData = new FormData();
    formData.set('title', ' Form Title ');
    formData.set('slug', 'Form Title');
    formData.set('type', 'project');
    formData.set('summary', ' Form summary ');
    formData.set('bodyMarkdown', '# Form Title');
    formData.set('allowComments', 'on');
    formData.set('featured', 'on');

    expect(buildContentPayloadFromFormData(formData)).toEqual({
      title: 'Form Title',
      slug: 'form-title',
      type: 'project',
      summary: 'Form summary',
      bodyMarkdown: '# Form Title',
      allowComments: true,
      pinned: false,
      featured: true,
    });
  });
});
