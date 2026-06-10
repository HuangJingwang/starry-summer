import type { ContentSourceType, ContentStatus, ContentType, ProjectLinks, ProjectMetadata, ProjectStatus } from '@starry-summer/shared';

import { getPublicContent, seedContent, type ContentSort, type SiteContentItem } from './content';

export interface PublicContentApiRecord {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary?: string;
  status: ContentStatus;
  visibility?: SiteContentItem['visibility'];
  featured?: boolean;
  pinned?: boolean;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  coverImageUrl?: string;
  coverAltText?: string;
  categories?: string[];
  tags?: string[];
  series?: string[];
  bodyMarkdown?: string;
  allowComments?: boolean;
  viewCount?: number;
  likeCount?: number;
  project?: ProjectMetadata;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface PublicContentListRequestOptions {
  apiBaseUrl?: string;
  type?: ContentType;
  sort?: ContentSort;
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

const validProjectStatuses = new Set<ProjectStatus>(['active', 'paused', 'completed', 'archived']);
const projectLinkKeys: Array<keyof ProjectLinks> = ['website', 'repository', 'demo', 'article'];

function getDefaultApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
}

export function buildPublicContentListRequest(options: PublicContentListRequestOptions = {}): PublicContentRequest {
  const baseUrl = (options.apiBaseUrl ?? getDefaultApiBaseUrl()).replace(/\/$/, '');
  const params = new URLSearchParams();

  if (options.type) {
    params.set('type', options.type);
  }

  if (options.sort && options.sort !== 'latest') {
    params.set('sort', options.sort);
  }

  const query = params.size > 0 ? `?${params.toString()}` : '';

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
  const project = normalizeProjectMetadata(record.project);
  const cover = normalizeCoverMetadata(record);

  return {
    id: record.id,
    title: record.title,
    type: record.type,
    status: record.status,
    visibility: record.visibility ?? 'public',
    publishedAt: dateOnly(record.publishedAt) || dateOnly(record.updatedAt) || dateOnly(record.createdAt),
    updatedAt: dateOnly(record.updatedAt),
    summary: record.summary ?? '',
    slug: record.slug,
    featured: record.featured ?? false,
    pinned: record.pinned ?? false,
    sourceType: record.sourceType ?? 'original',
    sourceUrl: record.sourceUrl ?? '',
    ...cover,
    categories: record.categories ?? [],
    tags: record.tags ?? [],
    series: record.series ?? [],
    bodyMarkdown: record.bodyMarkdown ?? '',
    allowComments: record.allowComments ?? true,
    viewCount: record.viewCount ?? 0,
    likeCount: record.likeCount ?? 0,
    ...(project ? { project } : {}),
  };
}

function normalizeCoverMetadata(record: Pick<PublicContentApiRecord, 'coverAssetId' | 'coverImageUrl' | 'coverAltText'>): Pick<SiteContentItem, 'coverAssetId' | 'coverImageUrl' | 'coverAltText'> {
  const coverAssetId = record.coverAssetId?.trim();
  const coverImageUrl = record.coverImageUrl?.trim();
  const coverAltText = record.coverAltText?.trim();

  return {
    ...(coverAssetId ? { coverAssetId } : {}),
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(coverAltText ? { coverAltText } : {}),
  };
}

function normalizeProjectMetadata(project: ProjectMetadata | undefined): ProjectMetadata | undefined {
  if (!project) {
    return undefined;
  }

  const normalized: ProjectMetadata = {};
  const links = normalizeProjectLinks(project.links);
  const stack = project.stack?.map((item) => item.trim()).filter(Boolean) ?? [];

  if (validProjectStatuses.has(project.status as ProjectStatus)) {
    normalized.status = project.status;
  }

  if (links) {
    normalized.links = links;
  }

  if (stack.length > 0) {
    normalized.stack = stack;
  }

  if (project.startedAt) {
    normalized.startedAt = project.startedAt.slice(0, 10);
  }

  if (project.endedAt) {
    normalized.endedAt = project.endedAt.slice(0, 10);
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

export async function loadPublicContentItems(
  fallbackItems: SiteContentItem[],
  options: PublicContentLoadOptions = {},
): Promise<PublicContentLoadResult> {
  const request = buildPublicContentListRequest(options);
  const fetcher = options.fetcher ?? fetch;

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return { source: 'fallback', items: getPublicContent(fallbackItems, options.type, options.sort) };
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return { source: 'fallback', items: getPublicContent(fallbackItems, options.type, options.sort) };
    }

    return {
      source: 'api',
      items: data.map((item) => normalizePublicContentItem(item as PublicContentApiRecord)),
    };
  } catch {
    return { source: 'fallback', items: getPublicContent(fallbackItems, options.type, options.sort) };
  }
}

export async function loadSiteContent(type?: ContentType, sort?: ContentSort): Promise<SiteContentItem[]> {
  return (await loadPublicContentItems(seedContent, { type, sort })).items;
}
