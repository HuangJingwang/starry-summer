import { isPublicContent, type ContentStatus, type ContentType, type ContentVisibility } from '@starry-summer/shared';

export interface SiteContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  visibility: ContentVisibility;
  publishedAt: string;
  summary?: string;
  slug?: string;
  featured?: boolean;
  categories?: string[];
  tags?: string[];
  viewCount?: number;
  likeCount?: number;
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

export interface AdjacentContent {
  previous: SiteContentItem | null;
  next: SiteContentItem | null;
}

const contentTypes: ContentType[] = ['moment', 'note', 'page', 'post', 'project'];

export function getPublicContent(items: SiteContentItem[], type?: ContentType): SiteContentItem[] {
  return items
    .filter((item) => isPublicContent(item))
    .filter((item) => (type ? item.type === type : true))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getFeaturedContent(items: SiteContentItem[]): SiteContentItem[] {
  return getPublicContent(items).sort((a, b) => {
    if (Boolean(a.featured) === Boolean(b.featured)) {
      return b.publishedAt.localeCompare(a.publishedAt);
    }

    return a.featured ? -1 : 1;
  });
}

export function groupContentCounts(items: SiteContentItem[]): Record<ContentType, number> {
  const counts = Object.fromEntries(contentTypes.map((type) => [type, 0])) as Record<ContentType, number>;

  for (const item of getPublicContent(items)) {
    counts[item.type] += 1;
  }

  return counts;
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
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  return getPublicContent(items).filter((item) => {
    const searchable = [item.title, item.summary ?? '', ...(item.tags ?? [])].join(' ').toLowerCase();

    return searchable.includes(normalizedQuery);
  });
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

export const seedContent: SiteContentItem[] = [
  {
    id: 'intro-post',
    title: '把个人站做成长期内容系统',
    type: 'post',
    status: 'published',
    visibility: 'public',
    publishedAt: '2026-06-10',
    summary: '从博客、笔记、日常和项目四条线开始，把写作和作品沉淀成一个可部署的平台。',
    slug: 'personal-content-platform',
    featured: true,
    categories: ['Writing', 'Platform'],
    tags: ['Platform', 'Writing', 'System'],
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
    slug: 'markdown-ownership',
    categories: ['Notes', 'Writing'],
    tags: ['Markdown', 'Archive'],
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
    slug: 'starry-summer',
    featured: true,
    categories: ['Projects', 'Platform'],
    tags: ['Next.js', 'NestJS', 'PostgreSQL'],
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
    slug: 'about',
    categories: ['Site'],
    tags: ['About'],
    viewCount: 31,
    likeCount: 2,
  },
];
