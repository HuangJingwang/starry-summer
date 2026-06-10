import type { ContentStatus, ContentType } from '@starry-summer/shared';

import { getPublicContent, seedContent, type SiteContentItem } from './content';

export interface PublicContentApiRecord {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary?: string;
  status: ContentStatus;
  visibility?: SiteContentItem['visibility'];
  featured?: boolean;
  categories?: string[];
  tags?: string[];
  viewCount?: number;
  likeCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface PublicContentListRequestOptions {
  apiBaseUrl?: string;
  type?: ContentType;
}

export interface PublicContentRequest {
  url: string;
  init: RequestInit & { next?: { revalidate: number } };
}

export interface PublicContentLoadOptions extends PublicContentListRequestOptions {
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}

export interface PublicContentLoadResult {
  source: 'api' | 'fallback';
  items: SiteContentItem[];
}

function dateOnly(value: string | null | undefined): string {
  return value?.slice(0, 10) || '';
}

function getDefaultApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
}

export function buildPublicContentListRequest(options: PublicContentListRequestOptions = {}): PublicContentRequest {
  const baseUrl = (options.apiBaseUrl ?? getDefaultApiBaseUrl()).replace(/\/$/, '');
  const query = options.type ? `?type=${encodeURIComponent(options.type)}` : '';

  return {
    url: `${baseUrl}/content${query}`,
    init: {
      method: 'GET',
      next: {
        revalidate: 60,
      },
    },
  };
}

export function normalizePublicContentItem(record: PublicContentApiRecord): SiteContentItem {
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
    categories: record.categories ?? [],
    tags: record.tags ?? [],
    viewCount: record.viewCount ?? 0,
    likeCount: record.likeCount ?? 0,
  };
}

export async function loadPublicContentItems(
  fallbackItems: SiteContentItem[],
  options: PublicContentLoadOptions = {},
): Promise<PublicContentLoadResult> {
  const request = buildPublicContentListRequest(options);
  const fetcher = options.fetcher ?? fetch;

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return { source: 'fallback', items: getPublicContent(fallbackItems, options.type) };
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return { source: 'fallback', items: getPublicContent(fallbackItems, options.type) };
    }

    return {
      source: 'api',
      items: data.map((item) => normalizePublicContentItem(item as PublicContentApiRecord)),
    };
  } catch {
    return { source: 'fallback', items: getPublicContent(fallbackItems, options.type) };
  }
}

export async function loadSiteContent(type?: ContentType): Promise<SiteContentItem[]> {
  return (await loadPublicContentItems(seedContent, { type })).items;
}
