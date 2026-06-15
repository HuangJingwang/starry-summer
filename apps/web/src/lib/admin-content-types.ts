import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectMetadata } from '@starry-summer/shared';

import type { SiteContentItem } from './content';

export interface AdminContentFilters {
  type?: ContentType;
  status?: ContentStatus;
  query?: string;
  category?: string;
  tag?: string;
  series?: string;
}

export interface AdminContentSearchParams {
  q?: string;
  status?: string;
  type?: string;
  category?: string;
  tag?: string;
  series?: string;
}

export interface AdminContentRequestOptions {
  apiBaseUrl?: string;
  cookieHeader?: string;
  filters?: AdminContentSearchParams;
}

export interface AdminContentStats {
  total: number;
  draft: number;
  published: number;
  private: number;
  archived: number;
}

export interface AdminContentStatusCard {
  label: string;
  value: number;
  href: string;
  active: boolean;
}

export interface AdminContentRecentItem {
  id: string;
  title: string;
  href: string;
  meta: string;
}

export interface AdminContentDashboard {
  stats: AdminContentStats;
  filteredTotal: number;
  activeFilters: string[];
  statusCards: AdminContentStatusCard[];
  recentItems: AdminContentRecentItem[];
}

export interface AdminContentDashboardOptions {
  basePath?: string;
}

export interface AdminOverviewItem {
  id: string;
  title: string;
  href: string;
  meta: string;
  metric: string;
}

export interface AdminOverviewSnapshot {
  totals: {
    views: number;
    likes: number;
  };
  draftQueue: AdminOverviewItem[];
  topContent: AdminOverviewItem[];
  recentUpdates: AdminOverviewItem[];
}

export interface AdminContentSourceNoticeInput {
  loading: boolean;
  source: AdminContentLoadResult['source'];
  count: number;
}

export interface AdminContentSourceNotice {
  tone: 'loading' | 'success' | 'warning';
  text: string;
}

export interface MarkdownPreviewModel {
  title: string;
  excerpt: string;
  wordCount: number;
}

export interface ContentDraftSnapshot {
  title: string;
  slug: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  visibility: ContentVisibility;
  bodyMarkdown: string;
  savedAt: string;
}

export interface AdminContentApiRecord {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: ContentStatus;
  visibility?: SiteContentItem['visibility'];
  featured?: boolean;
  bodyMarkdown?: string;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  coverImageUrl?: string;
  coverAltText?: string;
  allowComments?: boolean;
  pinned?: boolean;
  viewCount?: number;
  likeCount?: number;
  categories?: string[];
  tags?: string[];
  series?: string[];
  project?: ProjectMetadata;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface AdminContentPayload {
  type?: ContentType;
  title?: string;
  slug?: string;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
  bodyMarkdown?: string;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  visibility?: ContentVisibility;
  allowComments?: boolean;
  pinned?: boolean;
  featured?: boolean;
  categories?: string[];
  tags?: string[];
  series?: string[];
  project?: ProjectMetadata;
}

export interface AdminMarkdownImportPayload {
  type: ContentType;
  markdown: string;
}

export interface AdminMarkdownArchiveImportPayload {
  markdown: string;
}

export interface AdminContentRequest {
  url: string;
  init: RequestInit;
}

export interface AdminContentLoadResult {
  source: 'api' | 'repository-file' | 'fallback';
  items: SiteContentItem[];
}

export interface AdminContentItemLoadResult {
  source: 'api' | 'repository-file' | 'fallback';
  item: SiteContentItem | null;
}

export type AdminContentFetcher = (url: string, init: RequestInit) => Promise<Response>;

export type AdminContentAction = 'publish' | 'archive' | 'restore-draft';
export type AdminContentBulkAction = AdminContentAction | 'private' | 'public';
