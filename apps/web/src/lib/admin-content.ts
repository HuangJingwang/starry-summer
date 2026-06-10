import type { ContentStatus, ContentType } from '@starry-summer/shared';

import type { SiteContentItem } from './content';

export interface AdminContentFilters {
  type?: ContentType;
  status?: ContentStatus;
  query?: string;
}

export interface AdminContentSearchParams {
  q?: string;
  status?: string;
  type?: string;
}

export interface AdminContentStats {
  total: number;
  draft: number;
  published: number;
  private: number;
  archived: number;
}

export interface MarkdownPreviewModel {
  title: string;
  excerpt: string;
  wordCount: number;
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
  allowComments?: boolean;
  pinned?: boolean;
  viewCount?: number;
  likeCount?: number;
  categories?: string[];
  tags?: string[];
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
  allowComments?: boolean;
  pinned?: boolean;
  featured?: boolean;
  categories?: string[];
  tags?: string[];
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
const validContentTypes = new Set<ContentType>(['post', 'note', 'moment', 'page', 'project']);

function dateOnly(value: string | null | undefined): string {
  return value?.slice(0, 10) || '';
}

export function normalizeAdminContentItem(record: AdminContentApiRecord): SiteContentItem {
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
    allowComments: record.allowComments ?? true,
    pinned: record.pinned ?? false,
    categories: record.categories ?? [],
    tags: record.tags ?? [],
    viewCount: record.viewCount ?? 0,
    likeCount: record.likeCount ?? 0,
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
  return {
    ...input,
    title: input.title?.trim(),
    slug: input.slug ? normalizeSlug(input.slug) : undefined,
    summary: input.summary?.trim(),
    categories: normalizeList(input.categories),
    tags: normalizeList(input.tags),
  };
}

function formText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '');
}

export function buildContentPayloadFromFormData(formData: FormData): AdminContentPayload {
  return normalizeContentPayload({
    title: formText(formData, 'title'),
    slug: formText(formData, 'slug'),
    type: formText(formData, 'type') as ContentType,
    summary: formText(formData, 'summary'),
    bodyMarkdown: formText(formData, 'bodyMarkdown'),
    categories: splitList(formText(formData, 'categories')),
    tags: splitList(formText(formData, 'tags')),
    allowComments: formData.has('allowComments'),
    pinned: formData.has('pinned'),
    featured: formData.has('featured'),
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

  return filters;
}

function jsonRequest(url: string, method: 'POST' | 'PATCH', input: AdminContentPayload): AdminContentRequest {
  return {
    url,
    init: {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(normalizeContentPayload(input)),
    },
  };
}

export function buildCreateDraftRequest(input: AdminContentPayload): AdminContentRequest {
  return jsonRequest('/api/admin/content', 'POST', input);
}

export function buildListAdminContentRequest(): AdminContentRequest {
  return {
    url: '/api/admin/content',
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildGetAdminContentRequest(id: string): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}`,
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export async function loadAdminContentItems(
  fallbackItems: SiteContentItem[],
  fetcher: AdminContentFetcher = (url, init) => fetch(url, init),
): Promise<AdminContentLoadResult> {
  const request = buildListAdminContentRequest();

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
): Promise<AdminContentItemLoadResult> {
  const request = buildGetAdminContentRequest(id);
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

export function getAdminContentStats(items: SiteContentItem[]): AdminContentStats {
  return {
    total: items.length,
    draft: items.filter((item) => item.status === 'draft').length,
    published: items.filter((item) => item.status === 'published').length,
    private: items.filter((item) => item.visibility === 'private').length,
    archived: items.filter((item) => item.status === 'archived').length,
  };
}

export function filterAdminContent(items: SiteContentItem[], filters: AdminContentFilters): SiteContentItem[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? '';

  return items
    .filter((item) => (filters.type ? item.type === filters.type : true))
    .filter((item) => (filters.status ? item.status === filters.status : true))
    .filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchable = [item.title, item.summary ?? '', ...(item.categories ?? []), ...(item.tags ?? [])]
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
