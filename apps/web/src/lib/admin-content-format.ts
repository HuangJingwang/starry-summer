import type { ContentStatus } from '@starry-summer/shared';

import type { SiteContentItem } from './content';

export const adminContentTypeLabels: Record<SiteContentItem['type'], string> = {
  post: '文章',
  note: '笔记',
  moment: '日常',
  page: '页面',
  project: '项目',
};

export const adminContentStatusLabels: Record<ContentStatus, string> = {
  draft: '草稿',
  published: '已发布',
  private: '私密',
  archived: '已归档',
};

export function formatAdminContentType(type: SiteContentItem['type']): string {
  return adminContentTypeLabels[type] ?? type;
}

export function formatAdminContentStatus(status: SiteContentItem['status']): string {
  return adminContentStatusLabels[status] ?? status;
}

export function formatAdminContentVisibilityStatus(item: Pick<SiteContentItem, 'status' | 'visibility'>): string {
  return item.visibility === 'private' ? '私密' : formatAdminContentStatus(item.status);
}
