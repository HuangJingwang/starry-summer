import type { ContentStatus, ContentType } from '@starry-summer/shared';

import type { SiteContentItem } from './content';

export interface AdminContentFilters {
  type?: ContentType;
  status?: ContentStatus;
  query?: string;
}

export interface AdminContentStats {
  total: number;
  draft: number;
  published: number;
  private: number;
  archived: number;
}

export interface MarkdownPreviewModel {
  title: string;
  excerpt: string;
  wordCount: number;
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

export function filterAdminContent(items: SiteContentItem[], filters: AdminContentFilters): SiteContentItem[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? '';

  return items
    .filter((item) => (filters.type ? item.type === filters.type : true))
    .filter((item) => (filters.status ? item.status === filters.status : true))
    .filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchable = [item.title, item.summary ?? '', ...(item.tags ?? [])].join(' ').toLowerCase();

      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function createMarkdownPreview(markdown: string): MarkdownPreviewModel {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.find((line) => line.startsWith('# '));
  const firstParagraph = lines.find((line) => !line.startsWith('#') && !line.startsWith('```')) ?? '';
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]()!-]/g, ' ')
    .trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  return {
    title: heading?.replace(/^#\s+/, '').trim() || 'Untitled',
    excerpt: firstParagraph,
    wordCount,
  };
}
