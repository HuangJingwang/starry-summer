import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectLinks, ProjectMetadata, ProjectStatus } from '@starry-summer/shared';

import type { SiteContentItem } from './content';
import type { AdminContentApiRecord, AdminContentFilters, AdminContentPayload, AdminContentSearchParams } from './admin-content-types';

const validContentStatuses = new Set<ContentStatus>(['draft', 'published', 'private', 'archived']);
export const validContentVisibility = new Set<ContentVisibility>(['public', 'private']);
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
    seoTitle: record.seoTitle?.trim() || undefined,
    seoDescription: record.seoDescription?.trim() || undefined,
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
    updatedAt: dateOnly(record.updatedAt) || undefined,
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

export function normalizeContentPayload(input: AdminContentPayload): AdminContentPayload {
  const project = input.project !== undefined ? normalizeProjectMetadata(input.project) : undefined;
  const { project: _project, ...rest } = input;

  return {
    ...rest,
    title: input.title?.trim(),
    slug: input.slug ? normalizeSlug(input.slug) : undefined,
    summary: input.summary?.trim(),
    seoTitle: input.seoTitle?.trim(),
    seoDescription: input.seoDescription?.trim(),
    sourceType: input.sourceType === 'repost' ? 'repost' : 'original',
    sourceUrl: input.sourceUrl?.trim() ?? '',
    coverAssetId: input.coverAssetId?.trim() ?? '',
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

export function buildContentPayloadFromFormData(formData: FormData): AdminContentPayload {
  return normalizeContentPayload({
    title: formText(formData, 'title'),
    slug: formText(formData, 'slug'),
    type: formText(formData, 'type') as ContentType,
    summary: formText(formData, 'summary'),
    seoTitle: formText(formData, 'seoTitle'),
    seoDescription: formText(formData, 'seoDescription'),
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
