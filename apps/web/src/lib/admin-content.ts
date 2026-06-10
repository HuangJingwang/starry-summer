import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectLinks, ProjectMetadata, ProjectStatus } from '@starry-summer/shared';

import type { SiteContentItem } from './content';

export interface AdminContentFilters {
  type?: ContentType;
  status?: ContentStatus;
  query?: string;
  category?: string;
  tag?: string;
  series?: string;
}

export interface AdminContentSearchParams {
  q?: string;
  status?: string;
  type?: string;
  category?: string;
  tag?: string;
  series?: string;
}

export interface AdminContentRequestOptions {
  apiBaseUrl?: string;
  cookieHeader?: string;
  filters?: AdminContentSearchParams;
}

export interface AdminContentStats {
  total: number;
  draft: number;
  published: number;
  private: number;
  archived: number;
}

export interface AdminContentStatusCard {
  label: string;
  value: number;
  href: string;
  active: boolean;
}

export interface AdminContentRecentItem {
  id: string;
  title: string;
  href: string;
  meta: string;
}

export interface AdminContentDashboard {
  stats: AdminContentStats;
  filteredTotal: number;
  activeFilters: string[];
  statusCards: AdminContentStatusCard[];
  recentItems: AdminContentRecentItem[];
}

export interface AdminContentDashboardOptions {
  basePath?: string;
}

export interface MarkdownPreviewModel {
  title: string;
  excerpt: string;
  wordCount: number;
}

export interface ContentDraftSnapshot {
  title: string;
  slug: string;
  summary: string;
  visibility: ContentVisibility;
  bodyMarkdown: string;
  savedAt: string;
}

export interface AdminContentApiRecord {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary?: string;
  status: ContentStatus;
  visibility?: SiteContentItem['visibility'];
  featured?: boolean;
  bodyMarkdown?: string;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  coverImageUrl?: string;
  coverAltText?: string;
  allowComments?: boolean;
  pinned?: boolean;
  viewCount?: number;
  likeCount?: number;
  categories?: string[];
  tags?: string[];
  series?: string[];
  project?: ProjectMetadata;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface AdminContentPayload {
  type?: ContentType;
  title?: string;
  slug?: string;
  summary?: string;
  bodyMarkdown?: string;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  visibility?: ContentVisibility;
  allowComments?: boolean;
  pinned?: boolean;
  featured?: boolean;
  categories?: string[];
  tags?: string[];
  series?: string[];
  project?: ProjectMetadata;
}

export interface AdminMarkdownImportPayload {
  type: ContentType;
  markdown: string;
}

export interface AdminMarkdownArchiveImportPayload {
  markdown: string;
}

export interface AdminContentRequest {
  url: string;
  init: RequestInit;
}

export interface AdminContentLoadResult {
  source: 'api' | 'fallback';
  items: SiteContentItem[];
}

export interface AdminContentItemLoadResult {
  source: 'api' | 'fallback';
  item: SiteContentItem | null;
}

export type AdminContentFetcher = (url: string, init: RequestInit) => Promise<Response>;

export type AdminContentAction = 'publish' | 'archive' | 'restore-draft';

const validContentStatuses = new Set<ContentStatus>(['draft', 'published', 'private', 'archived']);
const validContentVisibility = new Set<ContentVisibility>(['public', 'private']);
const validContentTypes = new Set<ContentType>(['post', 'note', 'moment', 'page', 'project']);
const validProjectStatuses = new Set<ProjectStatus>(['active', 'paused', 'completed', 'archived']);
const projectLinkKeys: Array<keyof ProjectLinks> = ['website', 'repository', 'demo', 'article'];
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function dateOnly(value: string | null | undefined): string {
  return value?.slice(0, 10) || '';
}

export function normalizeAdminContentItem(record: AdminContentApiRecord): SiteContentItem {
  const project = normalizeProjectMetadata(record.project);
  const cover = normalizeCoverMetadata(record);

  return {
    id: record.id,
    title: record.title,
    type: record.type,
    status: record.status,
    visibility: record.visibility ?? 'public',
    publishedAt: dateOnly(record.publishedAt) || dateOnly(record.updatedAt) || dateOnly(record.createdAt),
    summary: record.summary ?? '',
    slug: record.slug,
    featured: record.featured ?? false,
    bodyMarkdown: record.bodyMarkdown ?? '',
    sourceType: record.sourceType ?? 'original',
    sourceUrl: record.sourceUrl ?? '',
    allowComments: record.allowComments ?? true,
    pinned: record.pinned ?? false,
    categories: record.categories ?? [],
    tags: record.tags ?? [],
    series: record.series ?? [],
    viewCount: record.viewCount ?? 0,
    likeCount: record.likeCount ?? 0,
    ...cover,
    ...(project ? { project } : {}),
  };
}

function normalizeCoverMetadata(record: Pick<AdminContentApiRecord, 'coverAssetId' | 'coverImageUrl' | 'coverAltText'>): Pick<SiteContentItem, 'coverAssetId' | 'coverImageUrl' | 'coverAltText'> {
  const coverAssetId = record.coverAssetId?.trim();
  const coverImageUrl = record.coverImageUrl?.trim();
  const coverAltText = record.coverAltText?.trim();

  return {
    ...(coverAssetId ? { coverAssetId } : {}),
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(coverAltText ? { coverAltText } : {}),
  };
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeContentPayload(input: AdminContentPayload): AdminContentPayload {
  const project = input.project !== undefined ? normalizeProjectMetadata(input.project) : undefined;
  const { project: _project, ...rest } = input;

  return {
    ...rest,
    title: input.title?.trim(),
    slug: input.slug ? normalizeSlug(input.slug) : undefined,
    summary: input.summary?.trim(),
    sourceType: input.sourceType === 'repost' ? 'repost' : 'original',
    sourceUrl: input.sourceUrl?.trim() ?? '',
    coverAssetId: normalizeOptionalText(input.coverAssetId),
    visibility: validContentVisibility.has(input.visibility as ContentVisibility) ? input.visibility : undefined,
    categories: normalizeList(input.categories),
    tags: normalizeList(input.tags),
    series: normalizeList(input.series),
    ...(project ? { project } : {}),
  };
}

function formText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '');
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}

export function buildContentPayloadFromFormData(formData: FormData): AdminContentPayload {
  return normalizeContentPayload({
    title: formText(formData, 'title'),
    slug: formText(formData, 'slug'),
    type: formText(formData, 'type') as ContentType,
    summary: formText(formData, 'summary'),
    sourceType: formText(formData, 'sourceType') as ContentSourceType,
    sourceUrl: formText(formData, 'sourceUrl'),
    coverAssetId: formText(formData, 'coverAssetId'),
    visibility: formText(formData, 'visibility') as ContentVisibility,
    bodyMarkdown: formText(formData, 'bodyMarkdown'),
    categories: splitList(formText(formData, 'categories')),
    tags: splitList(formText(formData, 'tags')),
    series: splitList(formText(formData, 'series')),
    allowComments: formData.has('allowComments'),
    pinned: formData.has('pinned'),
    featured: formData.has('featured'),
    project: buildProjectMetadataFromFormData(formData),
  });
}

function splitList(value: string): string[] {
  return value.split(',');
}

function normalizeList(values: string[] | undefined): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const value of values ?? []) {
    const next = value.trim();
    const key = next.toLowerCase();

    if (next && !seen.has(key)) {
      normalized.push(next);
      seen.add(key);
    }
  }

  return normalized;
}

function buildProjectMetadataFromFormData(formData: FormData): ProjectMetadata | undefined {
  return {
    status: formText(formData, 'projectStatus') as ProjectStatus,
    links: {
      website: formText(formData, 'projectWebsiteUrl'),
      repository: formText(formData, 'projectRepositoryUrl'),
      demo: formText(formData, 'projectDemoUrl'),
      article: formText(formData, 'projectArticleUrl'),
    },
    stack: splitList(formText(formData, 'projectStack')),
    startedAt: formText(formData, 'projectStartedAt'),
    endedAt: formText(formData, 'projectEndedAt'),
  };
}

function normalizeProjectMetadata(project: ProjectMetadata | undefined): ProjectMetadata | undefined {
  if (!project) {
    return undefined;
  }

  const normalized: ProjectMetadata = {};
  const links = normalizeProjectLinks(project.links);
  const stack = normalizeList(project.stack);
  const startedAt = normalizeDateOnly(project.startedAt);
  const endedAt = normalizeDateOnly(project.endedAt);

  if (validProjectStatuses.has(project.status as ProjectStatus)) {
    normalized.status = project.status;
  }

  if (links) {
    normalized.links = links;
  }

  if (stack.length > 0) {
    normalized.stack = stack;
  }

  if (startedAt) {
    normalized.startedAt = startedAt;
  }

  if (endedAt) {
    normalized.endedAt = endedAt;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeProjectLinks(links: ProjectLinks | undefined): ProjectLinks | undefined {
  if (!links) {
    return undefined;
  }

  const normalized: ProjectLinks = {};

  for (const key of projectLinkKeys) {
    const value = links[key]?.trim();

    if (value) {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeDateOnly(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized && dateOnlyPattern.test(normalized) ? normalized : undefined;
}

export function normalizeAdminContentSearchParams(params: AdminContentSearchParams): AdminContentFilters {
  const query = params.q?.trim();
  const filters: AdminContentFilters = {};

  if (query) {
    filters.query = query;
  }

  if (params.status && validContentStatuses.has(params.status as ContentStatus)) {
    filters.status = params.status as ContentStatus;
  }

  if (params.type && validContentTypes.has(params.type as ContentType)) {
    filters.type = params.type as ContentType;
  }

  const category = params.category?.trim();
  const tag = params.tag?.trim();
  const series = params.series?.trim();

  if (category) {
    filters.category = category;
  }

  if (tag) {
    filters.tag = tag;
  }

  if (series) {
    filters.series = series;
  }

  return filters;
}

export function getInitialContentTypeFromSearchParams(params: Pick<AdminContentSearchParams, 'type'>): ContentType | undefined {
  return params.type && validContentTypes.has(params.type as ContentType) ? (params.type as ContentType) : undefined;
}

function withAdminRequestOptions(path: string, options: AdminContentRequestOptions = {}): Pick<AdminContentRequest, 'url'> & {
  headers?: HeadersInit;
} {
  const headers = options.cookieHeader ? { cookie: options.cookieHeader } : undefined;

  if (!options.apiBaseUrl) {
    return {
      url: path,
      headers,
    };
  }

  return {
    url: `${options.apiBaseUrl.replace(/\/$/, '')}${path.replace(/^\/api/, '')}`,
    headers,
  };
}

function appendAdminContentFilters(url: string, filters: AdminContentSearchParams | undefined): string {
  const params = new URLSearchParams();
  const query = filters?.q?.trim();

  if (query) {
    params.set('q', query);
  }

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (filters?.type) {
    params.set('type', filters.type);
  }

  const category = filters?.category?.trim();
  const tag = filters?.tag?.trim();
  const series = filters?.series?.trim();

  if (category) {
    params.set('category', category);
  }

  if (tag) {
    params.set('tag', tag);
  }

  if (series) {
    params.set('series', series);
  }

  const queryString = params.toString();

  return queryString ? `${url}?${queryString}` : url;
}

function jsonRequest(url: string, method: 'POST' | 'PATCH', input: AdminContentPayload): AdminContentRequest {
  const { visibility: _visibility, ...body } = normalizeContentPayload(input);

  return {
    url,
    init: {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  };
}

export function buildCreateDraftRequest(input: AdminContentPayload): AdminContentRequest {
  return jsonRequest('/api/admin/content', 'POST', input);
}

export function buildListAdminContentRequest(options: AdminContentRequestOptions = {}): AdminContentRequest {
  const request = withAdminRequestOptions('/api/admin/content', options);

  return {
    url: appendAdminContentFilters(request.url, options.filters),
    init: {
      method: 'GET',
      credentials: 'include',
      ...(request.headers ? { headers: request.headers } : {}),
    },
  };
}

export function buildGetAdminContentRequest(id: string, options: AdminContentRequestOptions = {}): AdminContentRequest {
  const request = withAdminRequestOptions(`/api/admin/content/${id}`, options);

  return {
    url: request.url,
    init: {
      method: 'GET',
      credentials: 'include',
      ...(request.headers ? { headers: request.headers } : {}),
    },
  };
}

export async function loadAdminContentItems(
  fallbackItems: SiteContentItem[],
  fetcher: AdminContentFetcher = (url, init) => fetch(url, init),
  options: AdminContentRequestOptions = {},
): Promise<AdminContentLoadResult> {
  const request = buildListAdminContentRequest(options);

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return { source: 'fallback', items: fallbackItems };
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return { source: 'fallback', items: fallbackItems };
    }

    return {
      source: 'api',
      items: data.map((item) => normalizeAdminContentItem(item as AdminContentApiRecord)),
    };
  } catch {
    return { source: 'fallback', items: fallbackItems };
  }
}

export async function loadAdminContentItem(
  id: string,
  fallbackItems: SiteContentItem[],
  fetcher: AdminContentFetcher = (url, init) => fetch(url, init),
  options: AdminContentRequestOptions = {},
): Promise<AdminContentItemLoadResult> {
  const request = buildGetAdminContentRequest(id, options);
  const fallback = fallbackItems.find((item) => item.id === id) ?? null;

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return { source: 'fallback', item: fallback };
    }

    const data: unknown = await response.json();

    if (!data || typeof data !== 'object') {
      return { source: 'fallback', item: fallback };
    }

    return {
      source: 'api',
      item: normalizeAdminContentItem(data as AdminContentApiRecord),
    };
  } catch {
    return { source: 'fallback', item: fallback };
  }
}

export function buildUpdateContentRequest(id: string, input: AdminContentPayload): AdminContentRequest {
  return jsonRequest(`/api/admin/content/${id}`, 'PATCH', input);
}

export function buildAdminContentActionRequest(id: string, action: AdminContentAction): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}/${action}`,
    init: {
      method: 'PATCH',
      credentials: 'include',
    },
  };
}

export function buildDeleteContentRequest(id: string): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}`,
    init: {
      method: 'DELETE',
      credentials: 'include',
    },
  };
}

export function buildSetContentVisibilityRequest(id: string, visibility: ContentVisibility): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}/visibility`,
    init: {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        visibility: validContentVisibility.has(visibility) ? visibility : 'public',
      }),
    },
  };
}

export function buildExportMarkdownRequest(id: string): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}/export`,
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildExportAllMarkdownRequest(): AdminContentRequest {
  return {
    url: '/api/admin/content/export/all',
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildImportMarkdownRequest(input: AdminMarkdownImportPayload): AdminContentRequest {
  return {
    url: '/api/admin/content/import',
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        type: input.type,
        markdown: input.markdown,
      }),
    },
  };
}

export function buildImportMarkdownArchiveRequest(input: AdminMarkdownArchiveImportPayload): AdminContentRequest {
  return {
    url: '/api/admin/content/import/archive',
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        markdown: input.markdown,
      }),
    },
  };
}

export function getAdminContentStats(items: SiteContentItem[]): AdminContentStats {
  return {
    total: items.length,
    draft: items.filter((item) => item.status === 'draft').length,
    published: items.filter((item) => item.status === 'published').length,
    private: items.filter((item) => item.visibility === 'private').length,
    archived: items.filter((item) => item.status === 'archived').length,
  };
}

export function buildAdminContentDashboard(
  items: SiteContentItem[],
  filters: AdminContentFilters = {},
  options: AdminContentDashboardOptions = {},
): AdminContentDashboard {
  const stats = getAdminContentStats(items);
  const filteredItems = filterAdminContent(items, filters);
  const { status: _status, ...statusBaseFilters } = filters;
  const statusStats = getAdminContentStats(filterAdminContent(items, statusBaseFilters));
  const basePath = options.basePath ?? '/admin/content';

  return {
    stats,
    filteredTotal: filteredItems.length,
    activeFilters: getActiveAdminFilterLabels(filters),
    statusCards: [
      { label: 'All', value: statusStats.total, href: basePath, active: !filters.status },
      { label: 'Drafts', value: statusStats.draft, href: `${basePath}?status=draft`, active: filters.status === 'draft' },
      { label: 'Published', value: statusStats.published, href: `${basePath}?status=published`, active: filters.status === 'published' },
      { label: 'Private', value: statusStats.private, href: `${basePath}?status=private`, active: filters.status === 'private' },
      { label: 'Archived', value: statusStats.archived, href: `${basePath}?status=archived`, active: filters.status === 'archived' },
    ],
    recentItems: filteredItems.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      href: `/admin/content/${item.id}`,
      meta: `${item.type} / ${item.visibility === 'private' ? 'private' : item.status} / ${item.publishedAt}`,
    })),
  };
}

export function filterAdminContent(items: SiteContentItem[], filters: AdminContentFilters): SiteContentItem[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? '';
  const normalizedCategory = filters.category?.trim().toLowerCase() ?? '';
  const normalizedTag = filters.tag?.trim().toLowerCase() ?? '';
  const normalizedSeries = filters.series?.trim().toLowerCase() ?? '';

  return items
    .filter((item) => (filters.type ? item.type === filters.type : true))
    .filter((item) => {
      if (!filters.status) {
        return true;
      }

      return filters.status === 'private' ? item.visibility === 'private' : item.status === filters.status;
    })
    .filter((item) => (normalizedCategory ? includesTaxonomyLabel(item.categories, normalizedCategory) : true))
    .filter((item) => (normalizedTag ? includesTaxonomyLabel(item.tags, normalizedTag) : true))
    .filter((item) => (normalizedSeries ? includesTaxonomyLabel(item.series, normalizedSeries) : true))
    .filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        item.title,
        item.summary ?? '',
        ...(item.categories ?? []),
        ...(item.tags ?? []),
        ...(item.series ?? []),
        ...(item.project?.stack ?? []),
        item.project?.status ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function includesTaxonomyLabel(labels: string[] | undefined, normalizedFilter: string): boolean {
  return labels?.some((label) => label.trim().toLowerCase() === normalizedFilter) ?? false;
}

function getActiveAdminFilterLabels(filters: AdminContentFilters): string[] {
  return [
    filters.query ? `Search: ${filters.query}` : '',
    filters.type ? `Type: ${filters.type}` : '',
    filters.status ? `Status: ${filters.status}` : '',
    filters.category ? `Category: ${filters.category}` : '',
    filters.tag ? `Tag: ${filters.tag}` : '',
    filters.series ? `Series: ${filters.series}` : '',
  ].filter(Boolean);
}

export function createMarkdownPreview(markdown: string): MarkdownPreviewModel {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.find((line) => line.startsWith('# '));
  const firstParagraph = lines.find((line) => !line.startsWith('#') && !line.startsWith('```')) ?? '';
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]()!-]/g, ' ')
    .trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  return {
    title: heading?.replace(/^#\s+/, '').trim() || 'Untitled',
    excerpt: firstParagraph,
    wordCount,
  };
}

export function getUnsavedContentWarning(isDirty: boolean): string | null {
  return isDirty ? 'You have unsaved content changes.' : null;
}

export function getContentDraftStorageKey(contentId?: string): string {
  return `starry-summer:content-draft:${contentId || 'new'}`;
}

export function serializeContentDraftSnapshot(snapshot: ContentDraftSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseContentDraftSnapshot(value: string | null): ContentDraftSnapshot | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ContentDraftSnapshot>;

    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.slug !== 'string' ||
      typeof parsed.summary !== 'string' ||
      !validContentVisibility.has(parsed.visibility as ContentVisibility) ||
      typeof parsed.bodyMarkdown !== 'string' ||
      typeof parsed.savedAt !== 'string'
    ) {
      return null;
    }

    return {
      title: parsed.title,
      slug: parsed.slug,
      summary: parsed.summary,
      visibility: parsed.visibility as ContentVisibility,
      bodyMarkdown: parsed.bodyMarkdown,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}
