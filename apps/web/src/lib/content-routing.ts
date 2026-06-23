import type { ContentType } from '@starry-summer/shared';

import { getPublicContent } from './content-public';
import type { PublicContentKind, SiteContentItem } from './content-types';

export function getContentHref(item: SiteContentItem): string {
  const slug = item.slug ?? item.id;

  if (item.type === 'page' && slug === 'about') {
    return '/about';
  }

  const segmentByType: Record<ContentType, string> = {
    moment: 'moments',
    note: 'posts',
    page: 'pages',
    post: 'posts',
    project: 'projects',
  };

  return `/${segmentByType[item.type]}/${slug}`;
}

export function formatPublicContentType(type: SiteContentItem['type']): string {
  const labels: Record<SiteContentItem['type'], string> = {
    moment: '日常',
    note: '文章',
    page: '页面',
    post: '文章',
    project: '项目',
  };

  return labels[type];
}

export function getContentBySlug(
  items: SiteContentItem[],
  type: PublicContentKind,
  slug: string,
): SiteContentItem | null {
  return getPublicContent(items, type).find((item) => (item.slug ?? item.id) === slug) ?? null;
}
