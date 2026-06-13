import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectLinks, ProjectMetadata, ProjectStatus } from '@starry-summer/shared';

import type { ContentRecord } from './content.types.js';

export interface ContentItemRow {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  seo_title?: string | null;
  seo_description?: string | null;
  body_markdown: string;
  source_type: ContentSourceType;
  source_url: string;
  cover_asset_id?: string | null;
  cover_asset_url?: string | null;
  cover_asset_alt_text?: string | null;
  status: ContentStatus;
  visibility: ContentVisibility;
  allow_comments: boolean;
  pinned: boolean;
  featured: boolean;
  categories?: string[] | null;
  tags?: string[] | null;
  series?: string[] | null;
  view_count: number;
  like_count: number;
  project_status?: ProjectStatus | null;
  project_links?: ProjectLinks | null;
  project_stack?: string[] | null;
  project_started_at?: Date | string | null;
  project_ended_at?: Date | string | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export function mapContentRow(row: ContentItemRow): ContentRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    bodyMarkdown: row.body_markdown,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    coverAssetId: row.cover_asset_id ?? undefined,
    coverImageUrl: row.cover_asset_url ?? undefined,
    coverAltText: row.cover_asset_alt_text ?? undefined,
    status: row.status,
    visibility: row.visibility,
    allowComments: row.allow_comments,
    pinned: row.pinned,
    featured: row.featured,
    categories: row.categories ?? [],
    tags: row.tags ?? [],
    series: row.series ?? [],
    viewCount: row.view_count,
    likeCount: row.like_count,
    project: mapProjectMetadata(row),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    publishedAt: row.published_at?.toISOString() ?? null,
  };
}

function mapProjectMetadata(row: ContentItemRow): ProjectMetadata | undefined {
  const project: ProjectMetadata = {};
  const links = normalizeProjectLinks(row.project_links);
  const stack = row.project_stack?.filter(Boolean) ?? [];
  const startedAt = dateOnlyFromDatabase(row.project_started_at);
  const endedAt = dateOnlyFromDatabase(row.project_ended_at);

  if (row.project_status) {
    project.status = row.project_status;
  }

  if (links) {
    project.links = links;
  }

  if (stack.length > 0) {
    project.stack = stack;
  }

  if (startedAt) {
    project.startedAt = startedAt;
  }

  if (endedAt) {
    project.endedAt = endedAt;
  }

  return Object.keys(project).length > 0 ? project : undefined;
}

function normalizeProjectLinks(links: ProjectLinks | null | undefined): ProjectLinks | undefined {
  if (!links) {
    return undefined;
  }

  const normalized: ProjectLinks = {};
  const keys: Array<keyof ProjectLinks> = ['website', 'repository', 'demo', 'article'];

  for (const key of keys) {
    const value = links[key]?.trim();

    if (value) {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function dateOnlyFromDatabase(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}
