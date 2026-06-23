import { isPublicContent, type ContentType } from '@starry-summer/shared';

import type {
  ContentSort,
  PopularContentOptions,
  PublicContentKind,
  SiteContentItem,
  SiteStats,
} from './content-types';

const contentTypes: ContentType[] = ['moment', 'note', 'page', 'post', 'project'];

export function getPublicContent(items: SiteContentItem[], type?: PublicContentKind, sort: ContentSort = 'latest'): SiteContentItem[] {
  return items
    .filter((item) => isPublicContent(item))
    .filter((item) => matchesPublicContentKind(item, type))
    .sort((a, b) => sortPublicContent(a, b, sort));
}

export function normalizeContentSort(value: unknown): ContentSort {
  return value === 'popular' ? 'popular' : 'latest';
}

export function canShowComments(item: SiteContentItem): boolean {
  return ['post', 'note', 'project'].includes(item.type) && item.allowComments !== false;
}

export function estimateReadingTime(markdown: string): string {
  const normalized = markdown.trim();

  if (!normalized) {
    return '1 分钟阅读';
  }

  const cjkCharacters = normalized.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0;
  const latinWords = normalized.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ').match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const equivalentWords = latinWords + cjkCharacters;
  const minutes = Math.max(1, Math.ceil(equivalentWords / 200));

  return `${minutes} 分钟阅读`;
}

export function getFeaturedContent(items: SiteContentItem[]): SiteContentItem[] {
  return getPublicContent(items).sort((a, b) => {
    if (Boolean(a.featured) === Boolean(b.featured)) {
      return b.publishedAt.localeCompare(a.publishedAt);
    }

    return a.featured ? -1 : 1;
  });
}

export function getPopularContent(items: SiteContentItem[], options: PopularContentOptions = {}): SiteContentItem[] {
  const excludeIds = new Set(options.excludeIds ?? []);
  const popular = getPublicContent(items, undefined, 'popular').filter((item) => !excludeIds.has(item.id));

  return typeof options.limit === 'number' ? popular.slice(0, options.limit) : popular;
}

export function groupContentCounts(items: SiteContentItem[]): Record<ContentType, number> {
  const counts = Object.fromEntries(contentTypes.map((type) => [type, 0])) as Record<ContentType, number>;

  for (const item of getPublicContent(items)) {
    counts[item.type] += 1;
  }

  return counts;
}

export function getSiteStats(items: SiteContentItem[]): SiteStats {
  const publicItems = getPublicContent(items);

  return {
    publicCount: publicItems.length,
    totalViews: publicItems.reduce((sum, item) => sum + (item.viewCount ?? 0), 0),
    totalLikes: publicItems.reduce((sum, item) => sum + (item.likeCount ?? 0), 0),
    lastPublishedAt: publicItems[0]?.publishedAt ?? '',
  };
}

function sortPublicContent(a: SiteContentItem, b: SiteContentItem, sort: ContentSort): number {
  if (Boolean(a.pinned) !== Boolean(b.pinned)) {
    return a.pinned ? -1 : 1;
  }

  if (sort === 'popular') {
    const viewOrder = (b.viewCount ?? 0) - (a.viewCount ?? 0);

    if (viewOrder !== 0) {
      return viewOrder;
    }

    const likeOrder = (b.likeCount ?? 0) - (a.likeCount ?? 0);

    if (likeOrder !== 0) {
      return likeOrder;
    }
  }

  return b.publishedAt.localeCompare(a.publishedAt);
}

function matchesPublicContentKind(item: SiteContentItem, kind?: PublicContentKind): boolean {
  if (!kind) {
    return true;
  }

  if (kind === 'article') {
    return item.type === 'post' || item.type === 'note';
  }

  return item.type === kind;
}

