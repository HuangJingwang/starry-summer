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
  tags?: string[];
  viewCount?: number;
  likeCount?: number;
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
    tags: ['Daily'],
    viewCount: 44,
    likeCount: 6,
  },
];
