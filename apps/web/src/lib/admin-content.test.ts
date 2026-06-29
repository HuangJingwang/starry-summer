import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  buildContentPayloadFromFormData,
  buildRepositoryContentPublishPayload,
  buildRepositoryContentPublishRequest,
  buildAdminContentDashboard,
  buildAdminContentSelectionState,
  buildAdminContentItemSourceNotice,
  buildAdminContentSourceNotice,
  buildAdminOverviewSnapshot,
  formatAdminContentStatus,
  formatAdminContentType,
  formatAdminContentVisibilityStatus,
  getAdminContentUpdatedLabel,
  createMarkdownPreview,
  filterAdminContent,
  getAdminContentStats,
  getInitialContentTypeFromSearchParams,
  getContentDraftStorageKey,
  getUnsavedContentWarning,
  mergePublicContentIndex,
  normalizeAdminContentSearchParams,
  parseContentDraftSnapshot,
  readAdminContentErrorMessage,
  serializeContentDraftSnapshot,
} from './admin-content';
import { loadRepositoryAdminContentItem, loadRepositoryAdminContentItems } from './admin-content-repository';
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
  test('keeps admin content helpers split into focused modules behind a stable barrel', () => {
    const modulePaths = [
      'src/lib/admin-content-types.ts',
      'src/lib/admin-content-normalize.ts',
      'src/lib/admin-content-errors.ts',
      'src/lib/admin-content-dashboard.ts',
      'src/lib/admin-content-format.ts',
      'src/lib/admin-content-drafts.ts',
      'src/lib/admin-content-selection.ts',
      'src/lib/repository-content-publish.ts',
    ];
    const barrel = readFileSync(join(process.cwd(), 'src/lib/admin-content.ts'), 'utf8');

    for (const modulePath of modulePaths) {
      expect(readFileSync(join(process.cwd(), modulePath), 'utf8').length).toBeGreaterThan(0);
    }

    expect(barrel).toContain("export * from './admin-content-types';");
    expect(barrel).toContain("export * from './admin-content-normalize';");
    expect(barrel).toContain("export * from './admin-content-errors';");
    expect(barrel).toContain("export * from './admin-content-dashboard';");
    expect(barrel).toContain("export * from './admin-content-format';");
    expect(barrel).toContain("export * from './admin-content-drafts';");
    expect(barrel).toContain("export * from './admin-content-selection';");
    expect(barrel).toContain("export * from './repository-content-publish';");
    expect(barrel.split('\n')).toHaveLength(9);
  });

  test('formats admin content type and status labels consistently', () => {
    expect(formatAdminContentType('post')).toBeTruthy();
    expect(formatAdminContentType('note')).toBeTruthy();
    expect(formatAdminContentType('moment')).toBeTruthy();
    expect(formatAdminContentType('project')).toBeTruthy();
    expect(formatAdminContentStatus('published')).toBeTruthy();
    expect(formatAdminContentVisibilityStatus({ status: 'published', visibility: 'private' })).toBeTruthy();
    expect(formatAdminContentVisibilityStatus({ status: 'archived', visibility: 'public' })).toBeTruthy();
  });

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
    expect(dashboard.activeFilters).toEqual(['搜索：lab', expect.stringContaining('类型：'), expect.stringContaining('状态：')]);
    expect(dashboard.statusCards).toContainEqual({
      label: '私密',
      value: 1,
      href: '/admin/content?q=lab&type=project&status=private',
      active: true,
    });
    expect(dashboard.recentItems).toEqual([
      {
        id: 'private-project',
        title: 'Private Project',
        href: '/admin/content/private-project',
        meta: '项目 / 私密 / 2026-06-08',
      },
    ]);
  });

  test('builds an admin overview snapshot for next actions and content signals', () => {
    const snapshot = buildAdminOverviewSnapshot([
      ...items,
      {
        id: 'older-draft',
        title: 'Older Draft',
        type: 'post',
        status: 'draft',
        visibility: 'public',
        publishedAt: '2026-05-01',
        updatedAt: '2026-06-01T10:00:00.000Z',
        summary: 'Older draft',
      },
      {
        id: 'popular-post',
        title: 'Popular Post',
        type: 'post',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-06-11',
        updatedAt: '2026-06-11T10:00:00.000Z',
        summary: 'Popular public post',
        viewCount: 120,
        likeCount: 8,
      },
      {
        id: 'quiet-post',
        title: 'Quiet Post',
        type: 'post',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-06-12',
        summary: 'Quiet public post',
        viewCount: 9,
        likeCount: 1,
      },
    ]);

    expect(snapshot.totals).toEqual({ views: 129, likes: 9 });
    expect(snapshot.draftQueue.map((item) => item.id)).toEqual(['draft-post', 'older-draft']);
    expect(snapshot.draftQueue[0]).toMatchObject({
      title: 'Draft Post',
      href: '/admin/content/draft-post',
      meta: '文章 / 草稿 / 2026-06-10',
    });
    expect(snapshot.topContent.map((item) => item.id)).toEqual(['popular-post', 'quiet-post', 'published-note']);
    expect(snapshot.topContent[0]).toMatchObject({
      metric: '120 浏览 / 8 喜欢',
      href: '/admin/content/popular-post',
    });
    expect(snapshot.recentUpdates.map((item) => item.id)).toEqual(['quiet-post', 'popular-post', 'draft-post']);
  });

  test('builds explicit admin content data source notices', () => {
    expect(buildAdminContentSourceNotice({ loading: true, source: 'fallback', count: 3 })).toEqual({
      tone: 'loading',
      text: '正在读取后台内容...',
    });

    expect(buildAdminContentSourceNotice({ loading: false, source: 'api', count: 3 })).toEqual({
      tone: 'success',
      text: '已连接后台 API，当前显示 3 条数据库内容。',
    });

    expect(buildAdminContentSourceNotice({ loading: false, source: 'repository-file', count: 3 })).toEqual({
      tone: 'success',
      text: '已从仓库内容文件读取 3 条内容，不再依赖数据库列表。',
    });

    expect(buildAdminContentSourceNotice({ loading: false, source: 'fallback', count: 3 })).toEqual({
      tone: 'warning',
      text: '后台 API 未连接，当前显示 3 条本地样例内容，请不要把这里当成真实数据库。',
    });
  });

  test('builds explicit admin content edit source notices', () => {
    expect(buildAdminContentItemSourceNotice('api')).toEqual({
      tone: 'success',
      text: '已连接后台 API，当前正在编辑数据库内容。',
    });

    expect(buildAdminContentItemSourceNotice('repository-file')).toEqual({
      tone: 'success',
      text: '已从仓库内容文件读取当前条目，保存会写入 GitHub 仓库。',
    });

    expect(buildAdminContentItemSourceNotice('fallback')).toEqual({
      tone: 'warning',
      text: '后台 API 未连接，当前正在编辑本地样例内容，保存前请确认后端服务已连接。',
    });
  });
  test('builds project dashboard status links and counts against the project admin route', () => {
    const dashboard = buildAdminContentDashboard(items, { type: 'project', status: 'published' }, { basePath: '/admin/projects' });

    expect(dashboard.statusCards).toContainEqual({
      label: '全部',
      value: 1,
      href: '/admin/projects',
      active: false,
    });
    expect(dashboard.statusCards).toContainEqual({
      label: '已发布',
      value: 1,
      href: '/admin/projects?status=published',
      active: true,
    });
  });

  test('builds visible-only table selection state for filtered admin content', () => {
    const visibleRows = [{ id: 'draft-post' }, { id: 'published-note' }];

    expect(buildAdminContentSelectionState(visibleRows, ['private-project'])).toEqual({
      selectedIds: [],
      selectedCount: 0,
      allSelected: false,
      partiallySelected: false,
    });

    expect(buildAdminContentSelectionState(visibleRows, ['draft-post', 'private-project'])).toEqual({
      selectedIds: ['draft-post'],
      selectedCount: 1,
      allSelected: false,
      partiallySelected: true,
    });

    expect(buildAdminContentSelectionState(visibleRows, ['draft-post', 'published-note'])).toEqual({
      selectedIds: ['draft-post', 'published-note'],
      selectedCount: 2,
      allSelected: true,
      partiallySelected: false,
    });
  });

  test('preserves active non-status filters when building dashboard status links', () => {
    const dashboard = buildAdminContentDashboard(items, {
      query: 'lab',
      type: 'project',
      status: 'private',
      category: 'Lab',
      tag: 'Lab',
      series: 'Platform Journal',
    });

    expect(dashboard.statusCards).toContainEqual({
      label: '全部',
      value: 1,
      href: '/admin/content?q=lab&type=project&category=Lab&tag=Lab&series=Platform+Journal',
      active: false,
    });
    expect(dashboard.statusCards).toContainEqual({
      label: '草稿',
      value: 0,
      href: '/admin/content?q=lab&type=project&category=Lab&tag=Lab&series=Platform+Journal&status=draft',
      active: false,
    });
    expect(dashboard.statusCards).toContainEqual({
      label: '私密',
      value: 1,
      href: '/admin/content?q=lab&type=project&category=Lab&tag=Lab&series=Platform+Journal&status=private',
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

  test('formats admin table updated dates from updatedAt before publishedAt', () => {
    expect(
      getAdminContentUpdatedLabel({
        publishedAt: '',
        updatedAt: '2026-06-11T08:30:00.000Z',
      }),
    ).toBe('2026-06-11');

    expect(
      getAdminContentUpdatedLabel({
        publishedAt: '2026-06-10',
      }),
    ).toBe('2026-06-10');

    expect(getAdminContentUpdatedLabel({ publishedAt: '' })).toBe('暂无日期');
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
    expect(getUnsavedContentWarning(true)).toBeTruthy();
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

  test('builds repository content file payloads without an online publish request', () => {
    const request = buildRepositoryContentPublishRequest(
      {
        title: ' Repo Post ',
        slug: 'Repo Post',
        type: 'post',
        summary: ' Stored as files ',
        bodyMarkdown: '# Repo Post\n\nHello repository.',
        visibility: 'public',
        categories: ['Writing'],
        tags: ['GitHub'],
        series: ['Migration Log'],
        allowComments: true,
        featured: true,
      },
      {
        action: 'publish',
        now: new Date('2026-06-14T08:00:00.000Z'),
      },
    );

    expect(request).toBeNull();

    const payload = buildRepositoryContentPublishPayload(
      {
        title: ' Repo Post ',
        slug: 'Repo Post',
        type: 'post',
        summary: ' Stored as files ',
        bodyMarkdown: '# Repo Post\n\nHello repository.',
        visibility: 'public',
        categories: ['Writing'],
        tags: ['GitHub'],
        series: ['Migration Log'],
        allowComments: true,
        featured: true,
      },
      {
        action: 'publish',
        now: new Date('2026-06-14T08:00:00.000Z'),
      },
    );

    expect(payload).toMatchObject({
      action: 'publish',
      content: {
        id: 'repo-post',
        title: 'Repo Post',
        slug: 'repo-post',
        type: 'post',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-06-14',
        updatedAt: '2026-06-14',
        categories: ['Writing'],
        tags: ['GitHub'],
        series: ['Migration Log'],
      },
      files: [
        {
          path: 'apps/web/content/posts/repo-post.md',
        },
      ],
    });
    expect(String(payload.files[0]?.content)).toContain('title: Repo Post');
    expect(String(payload.files[0]?.content)).toContain('# Repo Post');
  });

  test('keeps repository draft saves private to the file publishing endpoint', () => {
    expect(
      buildRepositoryContentPublishPayload(
        {
          title: 'Draft Plan',
          slug: 'draft-plan',
          type: 'note',
          bodyMarkdown: 'Draft body',
          visibility: 'private',
        },
        { action: 'save', contentId: 'existing-note', now: new Date('2026-06-14T08:00:00.000Z') },
      ),
    ).toMatchObject({
      action: 'save',
      content: {
        id: 'existing-note',
        slug: 'draft-plan',
        status: 'draft',
        visibility: 'private',
        publishedAt: '',
        updatedAt: '2026-06-14',
      },
      files: [
        {
          path: 'apps/web/content/notes/draft-plan.md',
        },
      ],
    });
  });

  test('merges only published public repository content into the public index', () => {
    const existing: SiteContentItem[] = [
      {
        id: 'old-post',
        title: 'Old Post',
        type: 'post',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-06-10',
        slug: 'old-post',
      },
    ];
    const published = buildRepositoryContentPublishPayload(
      {
        title: 'New Post',
        slug: 'new-post',
        type: 'post',
        bodyMarkdown: 'New body',
        visibility: 'public',
      },
      { action: 'publish', now: new Date('2026-06-14T08:00:00.000Z') },
    ).content;
    const draft = buildRepositoryContentPublishPayload(
      {
        title: 'Draft Post',
        slug: 'draft-post',
        type: 'post',
        bodyMarkdown: 'Draft body',
        visibility: 'public',
      },
      { action: 'save', now: new Date('2026-06-14T08:00:00.000Z') },
    ).content;

    expect(mergePublicContentIndex(existing, published).map((item) => item.id)).toEqual(['new-post', 'old-post']);
    expect(mergePublicContentIndex(existing, draft)).toEqual(existing);
  });

  test('reads specific admin content response error messages', async () => {
    await expect(
      readAdminContentErrorMessage(
        new Response(JSON.stringify({ message: 'Slug already exists' }), {
          status: 409,
          headers: { 'content-type': 'application/json' },
        }),
        '保存失败。',
      ),
    ).resolves.toBe('Slug already exists');

    await expect(
      readAdminContentErrorMessage(
        new Response(JSON.stringify({ message: ['Title is required', 'Slug is invalid'] }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
        '保存失败。',
      ),
    ).resolves.toBe('Title is required；Slug is invalid');
  });

  test('falls back to a friendly admin content error when response has no readable message', async () => {
    await expect(readAdminContentErrorMessage(new Response('', { status: 500 }), '保存失败。')).resolves.toBe('保存失败。');
  });

  test('loads admin content records from repository files without the API', async () => {
    const contentFilePath = writeRepositoryContentFixture([
      {
        id: 'repo-draft',
        type: 'post',
        title: 'Repository Draft',
        slug: 'repository-draft',
        status: 'draft',
        visibility: 'public',
        publishedAt: '2026-06-12',
        summary: 'Draft in Git',
        categories: ['Writing'],
        tags: ['GitHub'],
        series: ['Build Log'],
      },
      {
        id: 'repo-project',
        type: 'project',
        title: 'Repository Project',
        slug: 'repository-project',
        status: 'published',
        visibility: 'private',
        publishedAt: '2026-06-11',
        summary: 'Private project in Git',
        categories: ['Lab'],
        tags: ['Cloudflare'],
        series: ['Platform'],
      },
    ]);

    await expect(loadRepositoryAdminContentItems({ contentFilePath, filters: { status: 'private', type: 'project' } })).resolves.toMatchObject({
      source: 'repository-file',
      items: [
        {
          id: 'repo-project',
          title: 'Repository Project',
          visibility: 'private',
          categories: ['Lab'],
        },
      ],
    });
  });

  test('loads a full admin content record from repository files', async () => {
    const contentFilePath = writeRepositoryContentFixture([
      {
        id: 'repo-note',
        type: 'note',
        title: 'Repository Note',
        slug: 'repository-note',
        status: 'published',
        visibility: 'public',
        publishedAt: '2026-06-13',
        updatedAt: '2026-06-14',
        summary: 'Loaded from Git',
        bodyMarkdown: '# Repository Note',
        tags: ['Git'],
      },
    ]);

    await expect(loadRepositoryAdminContentItem('repo-note', { contentFilePath })).resolves.toMatchObject({
      source: 'repository-file',
      item: {
        id: 'repo-note',
        title: 'Repository Note',
        bodyMarkdown: '# Repository Note',
        updatedAt: '2026-06-14',
      },
    });
  });

  test('reads content form data into a normalized content payload', () => {
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

  test('keeps empty clearable metadata fields in form payloads', () => {
    const formData = new FormData();
    formData.set('title', ' Clear Metadata ');
    formData.set('slug', 'clear-metadata');
    formData.set('type', 'post');
    formData.set('summary', ' Summary ');
    formData.set('seoTitle', ' ');
    formData.set('seoDescription', '');
    formData.set('sourceType', 'original');
    formData.set('sourceUrl', '');
    formData.set('coverAssetId', ' ');
    formData.set('visibility', 'public');
    formData.set('bodyMarkdown', '# Clear Metadata');

    expect(buildContentPayloadFromFormData(formData)).toMatchObject({
      seoTitle: '',
      seoDescription: '',
      sourceUrl: '',
      coverAssetId: '',
    });
  });
});

function writeRepositoryContentFixture(records: unknown[]): string {
  const directory = join(tmpdir(), `starry-admin-content-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(directory, { recursive: true });
  const contentFilePath = join(directory, 'public-content.json');
  writeFileSync(contentFilePath, JSON.stringify(records), 'utf8');

  return contentFilePath;
}
