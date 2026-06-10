import { describe, expect, test } from 'vitest';

import {
  buildAdminContentActionRequest,
  buildCreateDraftRequest,
  buildExportAllMarkdownRequest,
  buildGetAdminContentRequest,
  buildExportMarkdownRequest,
  buildImportMarkdownArchiveRequest,
  buildImportMarkdownRequest,
  buildContentPayloadFromFormData,
  buildDeleteContentRequest,
  buildListAdminContentRequest,
  buildSetContentVisibilityRequest,
  buildUpdateContentRequest,
  buildAdminContentDashboard,
  createMarkdownPreview,
  filterAdminContent,
  getAdminContentStats,
  getInitialContentTypeFromSearchParams,
  getContentDraftStorageKey,
  getUnsavedContentWarning,
  loadAdminContentItems,
  loadAdminContentItem,
  normalizeAdminContentItem,
  normalizeAdminContentSearchParams,
  parseContentDraftSnapshot,
  serializeContentDraftSnapshot,
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
    categories: ['Drafts'],
    tags: ['Writing'],
    series: ['Build Log'],
  },
  {
    id: 'published-note',
    title: 'Published Note',
    type: 'note',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-09',
    summary: 'A note',
    categories: ['Knowledge Base'],
    tags: ['Archive'],
    series: ['Research Notes'],
  },
  {
    id: 'private-project',
    title: 'Private Project',
    type: 'project',
    status: 'published',
    visibility: 'private',
    publishedAt: '2026-06-08',
    summary: 'Private work',
    categories: ['Lab'],
    tags: ['Lab'],
    series: ['Platform Journal'],
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

  test('builds a dashboard model for admin content operations', () => {
    const dashboard = buildAdminContentDashboard(
      [
        ...items,
        {
          id: 'archived-page',
          title: 'Archived Page',
          type: 'page',
          status: 'archived',
          visibility: 'public',
          publishedAt: '2026-06-01',
          summary: 'Old page',
        },
      ],
      { query: 'lab', status: 'private', type: 'project' },
    );

    expect(dashboard.stats).toEqual({
      total: 4,
      draft: 1,
      published: 2,
      private: 1,
      archived: 1,
    });
    expect(dashboard.filteredTotal).toBe(1);
    expect(dashboard.activeFilters).toEqual(['Search: lab', 'Type: project', 'Status: private']);
    expect(dashboard.statusCards).toContainEqual({
      label: 'Private',
      value: 1,
      href: '/admin/content?status=private',
      active: true,
    });
    expect(dashboard.recentItems).toEqual([
      {
        id: 'private-project',
        title: 'Private Project',
        href: '/admin/content/private-project',
        meta: 'project / private / 2026-06-08',
      },
    ]);
  });

  test('builds project dashboard status links and counts against the project admin route', () => {
    const dashboard = buildAdminContentDashboard(items, { type: 'project', status: 'published' }, { basePath: '/admin/projects' });

    expect(dashboard.statusCards).toContainEqual({
      label: 'All',
      value: 1,
      href: '/admin/projects',
      active: false,
    });
    expect(dashboard.statusCards).toContainEqual({
      label: 'Published',
      value: 1,
      href: '/admin/projects?status=published',
      active: true,
    });
  });

  test('filters content by type status and search text', () => {
    const draftPost = items.find((item) => item.id === 'draft-post');

    if (!draftPost) {
      throw new Error('Expected draft-post fixture');
    }

    expect(filterAdminContent(items, { type: 'note' }).map((item) => item.id)).toEqual(['published-note']);
    expect(filterAdminContent(items, { status: 'draft' }).map((item) => item.id)).toEqual(['draft-post']);
    expect(filterAdminContent(items, { status: 'private' }).map((item) => item.id)).toEqual(['private-project']);
    expect(filterAdminContent(items, { category: 'knowledge base' }).map((item) => item.id)).toEqual(['published-note']);
    expect(filterAdminContent(items, { tag: 'lab' }).map((item) => item.id)).toEqual(['private-project']);
    expect(filterAdminContent(items, { series: 'platform journal' }).map((item) => item.id)).toEqual(['private-project']);
    expect(filterAdminContent(items, { query: 'lab' }).map((item) => item.id)).toEqual(['private-project']);
    expect(filterAdminContent(items, { query: 'knowledge' }).map((item) => item.id)).toEqual(['published-note']);
    expect(filterAdminContent(items, { query: 'research notes' }).map((item) => item.id)).toEqual(['published-note']);
    expect(
      filterAdminContent(
        [
          {
            ...draftPost,
            seoTitle: 'Search Console Draft',
            seoDescription: 'Canonical launch checklist',
          },
        ],
        { query: 'canonical launch' },
      ).map((item) => item.id),
    ).toEqual(['draft-post']);
  });

  test('filters project content by stack terms', () => {
    expect(
      filterAdminContent(
        [
          {
            id: 'stacked-project',
            title: 'Stacked Project',
            type: 'project',
            status: 'published',
            visibility: 'public',
            publishedAt: '2026-06-11',
            summary: '',
            project: { stack: ['Next.js', 'PostgreSQL'] },
          },
        ],
        { type: 'project', query: 'postgresql' },
      ).map((item) => item.id),
    ).toEqual(['stacked-project']);
  });

  test('normalizes URL search params into valid admin content filters', () => {
    expect(normalizeAdminContentSearchParams({
      q: ' api ',
      status: 'draft',
      type: 'post',
      category: ' Lab ',
      tag: ' Roadmap ',
      series: ' Platform Journal ',
    })).toEqual({
      query: 'api',
      status: 'draft',
      type: 'post',
      category: 'Lab',
      tag: 'Roadmap',
      series: 'Platform Journal',
    });
    expect(normalizeAdminContentSearchParams({ q: 'x', status: 'deleted', type: 'article' })).toEqual({
      query: 'x',
    });
  });

  test('gets a safe initial content type from URL search params', () => {
    expect(getInitialContentTypeFromSearchParams({ type: 'project' })).toBe('project');
    expect(getInitialContentTypeFromSearchParams({ type: 'article' })).toBeUndefined();
  });

  test('creates a readable Markdown preview model', () => {
    const preview = createMarkdownPreview('# Hello\n\nThis is a first paragraph with useful context.');

    expect(preview.title).toBe('Hello');
    expect(preview.excerpt).toBe('This is a first paragraph with useful context.');
    expect(preview.wordCount).toBe(9);
  });

  test('warns before leaving a dirty content form', () => {
    expect(getUnsavedContentWarning(true)).toBe('You have unsaved content changes.');
    expect(getUnsavedContentWarning(false)).toBeNull();
  });

  test('serializes local content draft snapshots safely', () => {
    expect(getContentDraftStorageKey()).toBe('starry-summer:content-draft:new');
    expect(getContentDraftStorageKey('content-1')).toBe('starry-summer:content-draft:content-1');

    const serialized = serializeContentDraftSnapshot({
      title: 'Draft title',
      slug: 'draft-title',
      summary: 'Draft summary',
      seoTitle: 'Draft SEO title',
      seoDescription: 'Draft SEO description',
      visibility: 'private',
      bodyMarkdown: '# Draft',
      savedAt: '2026-06-11T00:00:00.000Z',
    });

    expect(parseContentDraftSnapshot(serialized)).toEqual({
      title: 'Draft title',
      slug: 'draft-title',
      summary: 'Draft summary',
      seoTitle: 'Draft SEO title',
      seoDescription: 'Draft SEO description',
      visibility: 'private',
      bodyMarkdown: '# Draft',
      savedAt: '2026-06-11T00:00:00.000Z',
    });
    expect(parseContentDraftSnapshot('not-json')).toBeNull();
    expect(parseContentDraftSnapshot(JSON.stringify({ title: 'Missing body' }))).toBeNull();
  });

  test('builds a normalized create draft request', () => {
    expect(
      buildCreateDraftRequest({
        title: ' New Post ',
        slug: 'New Post',
        type: 'post',
        summary: ' Summary ',
        seoTitle: ' New Post SEO ',
        seoDescription: ' Search preview ',
        bodyMarkdown: '# New Post',
        allowComments: true,
        pinned: false,
        featured: true,
        categories: ['Writing', 'Platform'],
        tags: ['Next.js', 'Architecture'],
        series: ['Build Log'],
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
          seoTitle: 'New Post SEO',
          seoDescription: 'Search preview',
          bodyMarkdown: '# New Post',
          allowComments: true,
          pinned: false,
          featured: true,
          categories: ['Writing', 'Platform'],
          tags: ['Next.js', 'Architecture'],
          series: ['Build Log'],
          sourceType: 'original',
          sourceUrl: '',
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
    expect(buildDeleteContentRequest('content-1')).toEqual({
      url: '/api/admin/content/content-1',
      init: {
        method: 'DELETE',
        credentials: 'include',
      },
    });
    expect(buildSetContentVisibilityRequest('content-1', 'private')).toEqual({
      url: '/api/admin/content/content-1/visibility',
      init: {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ visibility: 'private' }),
      },
    });
  });

  test('builds markdown import and export requests', () => {
    expect(buildExportMarkdownRequest('content-1')).toEqual({
      url: '/api/admin/content/content-1/export',
      init: {
        method: 'GET',
        credentials: 'include',
      },
    });
    expect(buildExportAllMarkdownRequest()).toEqual({
      url: '/api/admin/content/export/all',
      init: {
        method: 'GET',
        credentials: 'include',
      },
    });
    expect(buildImportMarkdownRequest({ type: 'post', markdown: '# Imported' })).toEqual({
      url: '/api/admin/content/import',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          type: 'post',
          markdown: '# Imported',
        }),
      },
    });
    expect(buildImportMarkdownArchiveRequest({ markdown: '# Starry Summer Markdown Export' })).toEqual({
      url: '/api/admin/content/import/archive',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          markdown: '# Starry Summer Markdown Export',
        }),
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
    expect(buildListAdminContentRequest({
      filters: { q: ' lab ', status: 'private', type: 'project', category: 'Lab', tag: 'Roadmap', series: 'Build Log' },
    }).url).toBe(
      '/api/admin/content?q=lab&status=private&type=project&category=Lab&tag=Roadmap&series=Build+Log',
    );
  });

  test('builds server admin content list requests with forwarded cookies', () => {
    expect(
      buildListAdminContentRequest({
        apiBaseUrl: 'https://api.example.com/',
        cookieHeader: 'ss_session=session-token',
        filters: { q: 'draft', status: 'draft', type: 'post', category: 'Drafts', tag: 'Writing', series: 'Build Log' },
      }),
    ).toEqual({
      url: 'https://api.example.com/admin/content?q=draft&status=draft&type=post&category=Drafts&tag=Writing&series=Build+Log',
      init: {
        method: 'GET',
        credentials: 'include',
        headers: {
          cookie: 'ss_session=session-token',
        },
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
        seoTitle: 'API SEO title',
        seoDescription: 'API SEO description',
        bodyMarkdown: '# Draft from API',
        status: 'draft',
        visibility: 'public',
        featured: true,
        sourceType: 'repost',
        sourceUrl: 'https://example.com/original',
        coverAssetId: 'asset-1',
        coverImageUrl: '/uploads/cover.png',
        coverAltText: 'Cover image',
        allowComments: false,
        pinned: true,
        viewCount: 10,
        likeCount: 2,
        categories: ['Writing'],
        tags: ['Platform'],
        series: ['Build Log'],
        project: {
          status: 'active',
          links: {
            website: 'https://example.com',
            repository: 'https://github.com/me/project',
          },
          stack: ['Next.js', 'PostgreSQL'],
          startedAt: '2026-01-01',
        },
        createdAt: '2026-06-09T00:00:00.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z',
        publishedAt: null,
      } as any),
    ).toEqual({
      id: 'content-1',
      type: 'post',
      title: 'Draft from API',
      slug: 'draft-from-api',
      summary: 'API summary',
      seoTitle: 'API SEO title',
      seoDescription: 'API SEO description',
      bodyMarkdown: '# Draft from API',
      status: 'draft',
      visibility: 'public',
      featured: true,
      sourceType: 'repost',
      sourceUrl: 'https://example.com/original',
      coverAssetId: 'asset-1',
      coverImageUrl: '/uploads/cover.png',
      coverAltText: 'Cover image',
      allowComments: false,
      pinned: true,
      viewCount: 10,
      likeCount: 2,
      publishedAt: '2026-06-10',
      categories: ['Writing'],
      tags: ['Platform'],
      series: ['Build Log'],
      project: {
        status: 'active',
        links: {
          website: 'https://example.com',
          repository: 'https://github.com/me/project',
        },
        stack: ['Next.js', 'PostgreSQL'],
        startedAt: '2026-01-01',
      },
    });
  });

  test('loads admin content records from the API', async () => {
    const seenUrls: string[] = [];
    const result = await loadAdminContentItems(items, async (url) => {
      seenUrls.push(url);
      return new Response(
        JSON.stringify([
          {
            id: 'api-note',
            type: 'note',
            title: 'API Note',
            slug: 'api-note',
            status: 'published',
            visibility: 'public',
            categories: ['Notes'],
            tags: ['API'],
            series: ['Build Log'],
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ]),
      );
    }, { filters: { status: 'private', type: 'project', category: 'Lab', tag: 'API', series: 'Build Log' } });

    expect(seenUrls).toEqual(['/api/admin/content?status=private&type=project&category=Lab&tag=API&series=Build+Log']);

    expect(result).toEqual({
      source: 'api',
      items: [
        {
          id: 'api-note',
          type: 'note',
          title: 'API Note',
          slug: 'api-note',
          summary: '',
          bodyMarkdown: '',
          status: 'published',
          visibility: 'public',
          allowComments: true,
          pinned: false,
          featured: false,
          sourceType: 'original',
          sourceUrl: '',
          viewCount: 0,
          likeCount: 0,
          publishedAt: '2026-06-10',
          categories: ['Notes'],
          tags: ['API'],
          series: ['Build Log'],
        },
      ],
    });
  });

  test('builds admin content detail request', () => {
    expect(buildGetAdminContentRequest('content-1')).toEqual({
      url: '/api/admin/content/content-1',
      init: {
        method: 'GET',
        credentials: 'include',
      },
    });
    expect(
      buildGetAdminContentRequest('content-1', {
        apiBaseUrl: 'https://api.example.com',
        cookieHeader: 'ss_session=session-token',
      }),
    ).toEqual({
      url: 'https://api.example.com/admin/content/content-1',
      init: {
        method: 'GET',
        credentials: 'include',
        headers: {
          cookie: 'ss_session=session-token',
        },
      },
    });
  });

  test('loads a full admin content record from the API', async () => {
    const result = await loadAdminContentItem('content-1', items, async () => {
      return new Response(
        JSON.stringify({
          id: 'content-1',
          type: 'post',
          title: 'API Post',
          slug: 'api-post',
          summary: 'API summary',
          seoTitle: 'API Post SEO',
          seoDescription: 'API Post search description',
          bodyMarkdown: '# API Post',
          status: 'draft',
          visibility: 'public',
          allowComments: false,
          pinned: true,
          featured: true,
          categories: ['Writing'],
          tags: ['API'],
          series: ['Build Log'],
          updatedAt: '2026-06-10T00:00:00.000Z',
        }),
      );
    });

    expect(result).toEqual({
      source: 'api',
      item: {
        id: 'content-1',
        type: 'post',
        title: 'API Post',
        slug: 'api-post',
        summary: 'API summary',
        seoTitle: 'API Post SEO',
        seoDescription: 'API Post search description',
        bodyMarkdown: '# API Post',
        status: 'draft',
        visibility: 'public',
        allowComments: false,
        pinned: true,
        featured: true,
        sourceType: 'original',
        sourceUrl: '',
        viewCount: 0,
        likeCount: 0,
        publishedAt: '2026-06-10',
        categories: ['Writing'],
        tags: ['API'],
        series: ['Build Log'],
      },
    });
  });

  test('falls back to seed content for admin edit pages when detail API is unavailable', async () => {
    const result = await loadAdminContentItem('draft-post', items, async () => new Response('Unauthorized', { status: 401 }));

    expect(result).toEqual({
      source: 'fallback',
      item: items[0],
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
    formData.set('seoTitle', ' Form SEO title ');
    formData.set('seoDescription', ' Form SEO description ');
    formData.set('sourceType', 'repost');
    formData.set('sourceUrl', ' https://example.com/source ');
    formData.set('coverAssetId', ' cover-asset-1 ');
    formData.set('visibility', 'private');
    formData.set('bodyMarkdown', '# Form Title');
    formData.set('categories', 'Projects, Platform, Projects');
    formData.set('tags', 'Next.js, Launch');
    formData.set('series', 'Build Log, Platform Journal, build log');
    formData.set('projectStatus', 'active');
    formData.set('projectWebsiteUrl', ' https://example.com ');
    formData.set('projectRepositoryUrl', ' https://github.com/me/project ');
    formData.set('projectDemoUrl', '');
    formData.set('projectArticleUrl', ' https://example.com/writeup ');
    formData.set('projectStack', 'Next.js, PostgreSQL, next.js');
    formData.set('projectStartedAt', '2026-01-01');
    formData.set('projectEndedAt', '');
    formData.set('allowComments', 'on');
    formData.set('featured', 'on');

    expect(buildContentPayloadFromFormData(formData)).toEqual({
      title: 'Form Title',
      slug: 'form-title',
      type: 'project',
      summary: 'Form summary',
      seoTitle: 'Form SEO title',
      seoDescription: 'Form SEO description',
      sourceType: 'repost',
      sourceUrl: 'https://example.com/source',
      coverAssetId: 'cover-asset-1',
      visibility: 'private',
      bodyMarkdown: '# Form Title',
      allowComments: true,
      pinned: false,
      featured: true,
      categories: ['Projects', 'Platform'],
      tags: ['Next.js', 'Launch'],
      series: ['Build Log', 'Platform Journal'],
      project: {
        status: 'active',
        links: {
          website: 'https://example.com',
          repository: 'https://github.com/me/project',
          article: 'https://example.com/writeup',
        },
        stack: ['Next.js', 'PostgreSQL'],
        startedAt: '2026-01-01',
      },
    });
  });
});
