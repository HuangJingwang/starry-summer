import type { ContentStatus } from '@starry-summer/shared';

import type { SiteContentItem } from './content';
import {
  adminContentStatusLabels,
  adminContentTypeLabels,
  formatAdminContentVisibilityStatus,
} from './admin-content-format';
import type {
  AdminContentDashboard,
  AdminContentDashboardOptions,
  AdminContentFilters,
  AdminContentItemLoadResult,
  AdminContentSourceNotice,
  AdminContentSourceNoticeInput,
  AdminContentStats,
  AdminOverviewSnapshot,
} from './admin-content-types';

function dateOnly(value: string | null | undefined): string {
  return value?.slice(0, 10) || '';
}

export function getAdminContentUpdatedLabel(item: Pick<SiteContentItem, 'publishedAt' | 'updatedAt'>): string {
  return dateOnly(item.updatedAt) || dateOnly(item.publishedAt) || '暂无日期';
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
      { label: '全部', value: statusStats.total, href: buildAdminStatusHref(basePath, filters), active: !filters.status },
      { label: '草稿', value: statusStats.draft, href: buildAdminStatusHref(basePath, filters, 'draft'), active: filters.status === 'draft' },
      { label: '已发布', value: statusStats.published, href: buildAdminStatusHref(basePath, filters, 'published'), active: filters.status === 'published' },
      { label: '私密', value: statusStats.private, href: buildAdminStatusHref(basePath, filters, 'private'), active: filters.status === 'private' },
      { label: '已归档', value: statusStats.archived, href: buildAdminStatusHref(basePath, filters, 'archived'), active: filters.status === 'archived' },
    ],
    recentItems: filteredItems.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      href: `/admin/content/${item.id}`,
      meta: `${adminContentTypeLabels[item.type]} / ${formatAdminContentVisibilityStatus(item)} / ${getAdminContentUpdatedLabel(item)}`,
    })),
  };
}

export function buildAdminOverviewSnapshot(items: SiteContentItem[]): AdminOverviewSnapshot {
  return {
    totals: {
      views: sumMetric(items, 'viewCount'),
      likes: sumMetric(items, 'likeCount'),
    },
    draftQueue: items
      .filter((item) => item.status === 'draft')
      .sort(compareByAdminSignalDate)
      .slice(0, 3)
      .map((item) => buildAdminOverviewItem(item)),
    topContent: items
      .filter((item) => item.status === 'published' && item.visibility === 'public')
      .sort((a, b) => getEngagementScore(b) - getEngagementScore(a) || compareByAdminSignalDate(a, b))
      .slice(0, 3)
      .map((item) => buildAdminOverviewItem(item)),
    recentUpdates: [...items]
      .sort(compareByAdminSignalDate)
      .slice(0, 3)
      .map((item) => buildAdminOverviewItem(item)),
  };
}

export function buildAdminContentSourceNotice(input: AdminContentSourceNoticeInput): AdminContentSourceNotice {
  if (input.loading) {
    return {
      tone: 'loading',
      text: '正在读取后台内容...',
    };
  }

  if (input.source === 'api') {
    return {
      tone: 'success',
      text: `已连接后台 API，当前显示 ${input.count} 条数据库内容。`,
    };
  }

  if (input.source === 'repository-file') {
    return {
      tone: 'success',
      text: `已从仓库内容文件读取 ${input.count} 条内容，不再依赖数据库列表。`,
    };
  }

  return {
    tone: 'warning',
    text: `后台 API 未连接，当前显示 ${input.count} 条本地样例内容，请不要把这里当成真实数据库。`,
  };
}

export function buildAdminContentItemSourceNotice(source: AdminContentItemLoadResult['source']): AdminContentSourceNotice {
  if (source === 'api') {
    return {
      tone: 'success',
      text: '已连接后台 API，当前正在编辑数据库内容。',
    };
  }

  if (source === 'repository-file') {
    return {
      tone: 'success',
      text: '已从仓库内容文件读取当前条目，保存会写入 GitHub 仓库。',
    };
  }

  return {
    tone: 'warning',
    text: '后台 API 未连接，当前正在编辑本地样例内容，保存前请确认后端服务已连接。',
  };
}

function buildAdminStatusHref(basePath: string, filters: AdminContentFilters, status?: ContentStatus): string {
  const params = new URLSearchParams();
  const query = filters.query?.trim();
  const category = filters.category?.trim();
  const tag = filters.tag?.trim();
  const series = filters.series?.trim();

  if (query) {
    params.set('q', query);
  }

  if (filters.type && basePath === '/admin/content') {
    params.set('type', filters.type);
  }

  if (category) {
    params.set('category', category);
  }

  if (tag) {
    params.set('tag', tag);
  }

  if (series) {
    params.set('series', series);
  }

  if (status) {
    params.set('status', status);
  }

  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
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
        item.seoTitle ?? '',
        item.seoDescription ?? '',
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

function buildAdminOverviewItem(item: SiteContentItem) {
  return {
    id: item.id,
    title: item.title,
    href: `/admin/content/${item.id}`,
    meta: `${adminContentTypeLabels[item.type]} / ${formatAdminContentVisibilityStatus(item)} / ${getAdminContentUpdatedLabel(item)}`,
    metric: `${item.viewCount ?? 0} 浏览 / ${item.likeCount ?? 0} 喜欢`,
  };
}

function compareByAdminSignalDate(a: SiteContentItem, b: SiteContentItem): number {
  return getAdminSignalDate(b).localeCompare(getAdminSignalDate(a));
}

function getAdminSignalDate(item: SiteContentItem): string {
  return item.updatedAt || item.publishedAt || '';
}

function getEngagementScore(item: SiteContentItem): number {
  return (item.viewCount ?? 0) + (item.likeCount ?? 0);
}

function sumMetric(items: SiteContentItem[], key: 'viewCount' | 'likeCount'): number {
  return items.reduce((total, item) => total + (item[key] ?? 0), 0);
}

function getActiveAdminFilterLabels(filters: AdminContentFilters): string[] {
  return [
    filters.query ? `搜索：${filters.query}` : '',
    filters.type ? `类型：${adminContentTypeLabels[filters.type]}` : '',
    filters.status ? `状态：${adminContentStatusLabels[filters.status]}` : '',
    filters.category ? `分类：${filters.category}` : '',
    filters.tag ? `标签：${filters.tag}` : '',
    filters.series ? `系列：${filters.series}` : '',
  ].filter(Boolean);
}
