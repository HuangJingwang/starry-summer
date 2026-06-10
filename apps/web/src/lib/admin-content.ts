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

export interface AdminContentPayload {
  type?: ContentType;
  title?: string;
  slug?: string;
  summary?: string;
  bodyMarkdown?: string;
  allowComments?: boolean;
  pinned?: boolean;
  featured?: boolean;
}

export interface AdminContentRequest {
  url: string;
  init: RequestInit;
}

export type AdminContentAction = 'publish' | 'archive' | 'restore-draft';

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeContentPayload(input: AdminContentPayload): AdminContentPayload {
  return {
    ...input,
    title: input.title?.trim(),
    slug: input.slug ? normalizeSlug(input.slug) : undefined,
    summary: input.summary?.trim(),
  };
}

function formText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '');
}

export function buildContentPayloadFromFormData(formData: FormData): AdminContentPayload {
  return normalizeContentPayload({
    title: formText(formData, 'title'),
    slug: formText(formData, 'slug'),
    type: formText(formData, 'type') as ContentType,
    summary: formText(formData, 'summary'),
    bodyMarkdown: formText(formData, 'bodyMarkdown'),
    allowComments: formData.has('allowComments'),
    pinned: formData.has('pinned'),
    featured: formData.has('featured'),
  });
}

function jsonRequest(url: string, method: 'POST' | 'PATCH', input: AdminContentPayload): AdminContentRequest {
  return {
    url,
    init: {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(normalizeContentPayload(input)),
    },
  };
}

export function buildCreateDraftRequest(input: AdminContentPayload): AdminContentRequest {
  return jsonRequest('/api/admin/content', 'POST', input);
}

export function buildUpdateContentRequest(id: string, input: AdminContentPayload): AdminContentRequest {
  return jsonRequest(`/api/admin/content/${id}`, 'PATCH', input);
}

export function buildAdminContentActionRequest(id: string, action: AdminContentAction): AdminContentRequest {
  return {
    url: `/api/admin/content/${id}/${action}`,
    init: {
      method: 'PATCH',
      credentials: 'include',
    },
  };
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
