import { isPublicContent, type ContentSourceType, type ContentStatus, type ContentType, type ContentVisibility, type ProjectMetadata } from '@starry-summer/shared';

export interface SiteContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  visibility: ContentVisibility;
  publishedAt: string;
  updatedAt?: string;
  summary?: string;
  bodyMarkdown?: string;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  coverImageUrl?: string;
  coverAltText?: string;
  slug?: string;
  featured?: boolean;
  categories?: string[];
  tags?: string[];
  series?: string[];
  viewCount?: number;
  likeCount?: number;
  allowComments?: boolean;
  pinned?: boolean;
  project?: ProjectMetadata;
}

export interface ContentArchiveGroup {
  key: string;
  label: string;
  items: SiteContentItem[];
}

export interface ContentCategoryGroup {
  key: string;
  label: string;
  items: SiteContentItem[];
}

export interface ContentSeriesGroup {
  key: string;
  label: string;
  items: SiteContentItem[];
}

export interface AdjacentContent {
  previous: SiteContentItem | null;
  next: SiteContentItem | null;
}

export interface ContentTaxonomyGroup {
  label: string;
  ariaLabel: string;
  items: string[];
}

export interface SiteStats {
  publicCount: number;
  totalViews: number;
  totalLikes: number;
  lastPublishedAt: string;
}

export interface PopularContentOptions {
  excludeIds?: string[];
  limit?: number;
}

export type ContentSort = 'latest' | 'popular';

const contentTypes: ContentType[] = ['moment', 'note', 'page', 'post', 'project'];

export function getPublicContent(items: SiteContentItem[], type?: ContentType, sort: ContentSort = 'latest'): SiteContentItem[] {
  return items
    .filter((item) => isPublicContent(item))
    .filter((item) => (type ? item.type === type : true))
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
    return '1 min read';
  }

  const cjkCharacters = normalized.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0;
  const latinWords = normalized.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ').match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const equivalentWords = latinWords + cjkCharacters;
  const minutes = Math.max(1, Math.ceil(equivalentWords / 200));

  return `${minutes} min read`;
}

export function getContentTaxonomyGroups(item: Pick<SiteContentItem, 'categories' | 'tags'>): ContentTaxonomyGroup[] {
  return [
    { label: '分类', ariaLabel: 'Categories', items: normalizeTaxonomyItems(item.categories) },
    { label: '标签', ariaLabel: 'Tags', items: normalizeTaxonomyItems(item.tags) },
  ].filter((group) => group.items.length > 0);
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

export function groupContentByMonth(items: SiteContentItem[]): ContentArchiveGroup[] {
  const groups = new Map<string, SiteContentItem[]>();

  for (const item of getPublicContent(items)) {
    const key = item.publishedAt.slice(0, 7);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, groupItems]) => {
    const [year, month] = key.split('-');

    return {
      key,
      label: `${year} 年 ${month} 月`,
      items: groupItems,
    };
  });
}

export function groupContentByCategory(items: SiteContentItem[]): ContentCategoryGroup[] {
  const groups = new Map<string, ContentCategoryGroup>();

  for (const item of getPublicContent(items)) {
    const categories = new Set(item.categories?.map((category) => category.trim()).filter(Boolean) ?? []);

    for (const category of categories) {
      const key = slugifyTaxonomyLabel(category);
      const group = groups.get(key) ?? { key, label: category, items: [] };
      group.items.push(item);
      groups.set(key, group);
    }
  }

  return [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
}

export function groupContentBySeries(items: SiteContentItem[]): ContentSeriesGroup[] {
  const groups = new Map<string, ContentSeriesGroup>();

  for (const item of getPublicContent(items)) {
    const seriesLabels = new Set(item.series?.map((series) => series.trim()).filter(Boolean) ?? []);

    for (const series of seriesLabels) {
      const key = slugifyTaxonomyLabel(series);
      const group = groups.get(key) ?? { key, label: series, items: [] };
      group.items.push(item);
      groups.set(key, group);
    }
  }

  return [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
}

export function getContentBySeriesSlug(items: SiteContentItem[], slug: string): ContentSeriesGroup | null {
  return groupContentBySeries(items).find((group) => group.key === slug) ?? null;
}

export function getSeriesHref(series: string): string {
  return `/series/${slugifyTaxonomyLabel(series)}`;
}

export function getAdjacentContent(items: SiteContentItem[], currentId: string): AdjacentContent {
  const timeline = [...getPublicContent(items)].reverse();
  const index = timeline.findIndex((item) => item.id === currentId);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: timeline[index - 1] ?? null,
    next: timeline[index + 1] ?? null,
  };
}

export function searchContent(items: SiteContentItem[], query: string): SiteContentItem[] {
  const terms = normalizeSearchTerms(query);

  if (terms.length === 0) {
    return [];
  }

  return getPublicContent(items)
    .map((item) => ({ item, score: scoreSearchResult(item, terms) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || b.item.publishedAt.localeCompare(a.item.publishedAt))
    .map((result) => result.item);
}

function normalizeSearchTerms(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreSearchResult(item: SiteContentItem, terms: string[]): number {
  const title = item.title.toLowerCase();
  const summary = (item.summary ?? '').toLowerCase();
  const taxonomy = [...(item.categories ?? []), ...(item.tags ?? []), ...(item.series ?? [])].join(' ').toLowerCase();
  const body = (item.bodyMarkdown ?? '').toLowerCase();
  const combined = [title, summary, taxonomy, body].join(' ');

  if (!terms.every((term) => combined.includes(term))) {
    return 0;
  }

  return terms.reduce((score, term) => {
    if (title.includes(term)) {
      return score + 8;
    }

    if (summary.includes(term)) {
      return score + 5;
    }

    if (taxonomy.includes(term)) {
      return score + 3;
    }

    return score + 1;
  }, 0);
}

export function getContentHref(item: SiteContentItem): string {
  const slug = item.slug ?? item.id;

  if (item.type === 'page' && slug === 'about') {
    return '/about';
  }

  const segmentByType: Record<ContentType, string> = {
    moment: 'moments',
    note: 'notes',
    page: 'pages',
    post: 'posts',
    project: 'projects',
  };

  return `/${segmentByType[item.type]}/${slug}`;
}

export function getContentBySlug(
  items: SiteContentItem[],
  type: ContentType,
  slug: string,
): SiteContentItem | null {
  return getPublicContent(items, type).find((item) => (item.slug ?? item.id) === slug) ?? null;
}

function slugifyTaxonomyLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTaxonomyItems(items: string[] | undefined): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const item of items ?? []) {
    const value = item.trim();
    const key = value.toLowerCase();

    if (value && !seen.has(key)) {
      normalized.push(value);
      seen.add(key);
    }
  }

  return normalized;
}

export const seedContent: SiteContentItem[] = [
  {
    id: 'intro-post',
    title: '把个人站做成长期内容系统',
    type: 'post',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-10',
    updatedAt: '2026-06-11',
    summary: '从博客、笔记、日常和项目四条线开始，把写作和作品沉淀成一个可部署的平台。',
    bodyMarkdown: [
      '## 为什么要做成系统',
      '',
      '个人博客不只是几篇文章的展示页。它应该能持续收纳文章、笔记、日常和项目，让内容随着时间自然生长。',
      '',
      '### 四条内容线',
      '',
      '- 文章负责沉淀完整思考',
      '- 笔记负责记录过程和片段',
      '- 项目负责展示作品和技术路线',
      '',
      '## 下一步',
      '',
      '这个站点会优先保证内容所有权、部署稳定性和后台写作效率。',
    ].join('\n'),
    slug: 'personal-content-platform',
    coverImageUrl: '/hero-workspace.png',
    coverAltText: 'Workspace cover image',
    featured: true,
    categories: ['Writing', 'Platform'],
    tags: ['Platform', 'Writing', 'System'],
    series: ['Platform Journal'],
    viewCount: 128,
    likeCount: 18,
  },
  {
    id: 'note-markdown',
    title: 'Markdown 是内容的逃生门',
    type: 'note',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-09',
    summary: '数据库负责运行时体验，Markdown 导入导出负责长期所有权。',
    bodyMarkdown: [
      '## 内容要能带走',
      '',
      '数据库适合检索、权限和互动，但长期内容不能只锁在数据库里。',
      '',
      'Markdown 是内容的逃生门：它足够朴素，也足够稳定。后续导入导出会围绕 frontmatter 和正文双向转换展开。',
    ].join('\n'),
    slug: 'markdown-ownership',
    categories: ['Notes', 'Writing'],
    tags: ['Markdown', 'Archive'],
    series: ['Platform Journal'],
    viewCount: 76,
    likeCount: 9,
  },
  {
    id: 'project-starry',
    title: 'Starry Summer',
    type: 'project',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-08',
    summary: '个人内容平台：文章、笔记、日常、项目、评论、留言和云服务器部署。',
    bodyMarkdown: [
      '## 平台目标',
      '',
      'Starry Summer 面向单人长期使用：公网展示内容，后台维护文章、笔记、项目和互动。',
      '',
      '当前技术栈选择 Next.js、NestJS、PostgreSQL 和 Docker Compose，方便先在一台云服务器上稳定运行，再按规模逐步拆分。',
    ].join('\n'),
    slug: 'starry-summer',
    coverImageUrl: '/hero-workspace.png',
    coverAltText: 'Workspace cover image',
    featured: true,
    categories: ['Projects', 'Platform'],
    tags: ['Next.js', 'NestJS', 'PostgreSQL'],
    series: ['Platform Journal'],
    project: {
      status: 'active',
      stack: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
      startedAt: '2026-06-10',
    },
    viewCount: 214,
    likeCount: 31,
  },
  {
    id: 'moment-first',
    title: '今天先把地基打好',
    type: 'moment',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-07',
    summary: '一个能长期长大的个人平台，第一天最重要的是边界清楚。',
    bodyMarkdown: '今天先把可部署的边界打清楚：公开页面、后台入口、API、数据库和部署流程各自独立，后面扩展才不会乱。',
    slug: 'first-foundation',
    categories: ['Daily'],
    tags: ['Daily'],
    viewCount: 44,
    likeCount: 6,
  },
  {
    id: 'about-page',
    title: 'About Starry Summer',
    type: 'page',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-06',
    summary: '一个用于沉淀写作、项目和日常记录的个人内容平台。',
    bodyMarkdown: 'Starry Summer 是一个个人内容系统，用来记录文章、笔记、日常和项目，也保留评论、留言和导出能力。',
    slug: 'about',
    categories: ['Site'],
    tags: ['About'],
    viewCount: 31,
    likeCount: 2,
  },
];
