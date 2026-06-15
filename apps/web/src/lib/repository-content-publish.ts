import { serializeMarkdownDocument, type MarkdownFrontmatter } from '@starry-summer/markdown';
import type { ContentStatus } from '@starry-summer/shared';

import { normalizeContentPayload } from './admin-content-normalize';
import type { AdminContentAction, AdminContentPayload, AdminContentRequest } from './admin-content-types';
import type { SiteContentItem } from './content';

export type RepositoryContentAction = AdminContentAction | 'save';

export interface RepositoryContentPublishOptions {
  contentId?: string;
  action?: RepositoryContentAction;
  now?: Date;
}

export interface RepositoryContentFile {
  path: string;
  content: string;
}

export interface RepositoryContentPublishPayload {
  action: RepositoryContentAction;
  content: SiteContentItem;
  files: RepositoryContentFile[];
}

const contentDirectoryByType: Record<SiteContentItem['type'], string> = {
  moment: 'moments',
  note: 'notes',
  page: 'pages',
  post: 'posts',
  project: 'projects',
};

export function buildRepositoryContentPublishRequest(
  input: AdminContentPayload,
  options: RepositoryContentPublishOptions = {},
): AdminContentRequest {
  return {
    url: '/api/repository/content',
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(buildRepositoryContentPublishPayload(input, options)),
    },
  };
}

export function buildRepositoryContentPublishPayload(
  input: AdminContentPayload,
  options: RepositoryContentPublishOptions = {},
): RepositoryContentPublishPayload {
  const content = buildRepositoryContentRecord(input, options);

  return {
    action: options.action ?? 'save',
    content,
    files: [
      {
        path: buildRepositoryMarkdownPath(content),
        content: serializeRepositoryContentMarkdown(content),
      },
    ],
  };
}

export function buildRepositoryContentRecord(
  input: AdminContentPayload,
  options: RepositoryContentPublishOptions = {},
): SiteContentItem {
  const payload = normalizeContentPayload(input);
  const slug = payload.slug || slugify(payload.title || options.contentId || 'untitled');
  const now = dateOnly(options.now ?? new Date());
  const status = getRepositoryContentStatus(options.action);

  return {
    id: options.contentId || slug,
    title: payload.title?.trim() || 'Untitled',
    slug,
    type: payload.type ?? 'post',
    status,
    visibility: payload.visibility ?? 'public',
    publishedAt: status === 'published' ? now : '',
    updatedAt: now,
    summary: payload.summary ?? '',
    seoTitle: payload.seoTitle || undefined,
    seoDescription: payload.seoDescription || undefined,
    bodyMarkdown: payload.bodyMarkdown ?? '',
    sourceType: payload.sourceType ?? 'original',
    sourceUrl: payload.sourceUrl ?? '',
    coverAssetId: payload.coverAssetId ?? '',
    allowComments: payload.allowComments ?? true,
    pinned: payload.pinned ?? false,
    featured: payload.featured ?? false,
    categories: payload.categories ?? [],
    tags: payload.tags ?? [],
    series: payload.series ?? [],
    viewCount: 0,
    likeCount: 0,
    ...(payload.project ? { project: payload.project } : {}),
  };
}

export function serializeRepositoryContentMarkdown(content: SiteContentItem): string {
  const {
    bodyMarkdown,
    coverAltText,
    coverImageUrl,
    viewCount: _viewCount,
    likeCount: _likeCount,
    ...frontmatter
  } = content;

  return serializeMarkdownDocument({
    frontmatter: removeEmptyFrontmatter({
      ...frontmatter,
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(coverAltText ? { coverAltText } : {}),
    }),
    body: bodyMarkdown ?? '',
  });
}

export function buildRepositoryMarkdownPath(content: Pick<SiteContentItem, 'type' | 'slug' | 'id'>): string {
  const slug = content.slug || content.id;

  return `apps/web/content/${contentDirectoryByType[content.type]}/${slug}.md`;
}

export function mergePublicContentIndex(existingItems: SiteContentItem[], content: SiteContentItem): SiteContentItem[] {
  const withoutCurrent = existingItems.filter((item) => item.id !== content.id && item.slug !== content.slug);

  if (content.status !== 'published' || content.visibility !== 'public') {
    return withoutCurrent;
  }

  return [...withoutCurrent, content].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function getRepositoryContentStatus(action: RepositoryContentAction | undefined): ContentStatus {
  if (action === 'publish') {
    return 'published';
  }

  if (action === 'archive') {
    return 'archived';
  }

  return 'draft';
}

function removeEmptyFrontmatter(input: Record<string, unknown>): MarkdownFrontmatter {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null || value === '') {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === 'object') {
        return Object.keys(value).length > 0;
      }

      return true;
    }),
  ) as MarkdownFrontmatter;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
