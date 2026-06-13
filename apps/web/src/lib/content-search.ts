import { getPublicContent } from './content-public';
import type { SiteContentItem } from './content-types';

export type SearchContentKind = 'all' | 'article' | 'moment' | 'project';

export interface SearchResultPreview {
  item: SiteContentItem;
  snippet: string;
  matchedFields: string[];
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

export function normalizeSearchContentKind(value: unknown): SearchContentKind {
  return value === 'article' || value === 'moment' || value === 'project' ? value : 'all';
}

export function buildSearchResultPreviews(items: SiteContentItem[], query: string): SearchResultPreview[] {
  const terms = normalizeSearchTerms(query);

  if (terms.length === 0) {
    return [];
  }

  return items
    .map((item) => buildSearchResultPreview(item, terms))
    .filter((preview): preview is SearchResultPreview => preview !== null);
}

export function splitHighlightedSearchText(text: string, query: string): Array<{ text: string; highlighted: boolean }> {
  const terms = normalizeSearchTerms(query);

  if (!text || terms.length === 0) {
    return text ? [{ text, highlighted: false }] : [];
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part) => ({
    text: part,
    highlighted: terms.some((term) => part.toLowerCase() === term),
  }));
}

export function normalizeSearchTerms(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function buildSearchResultPreview(item: SiteContentItem, terms: string[]): SearchResultPreview | null {
  const fields = getSearchableFields(item);
  const matchedFields = fields
    .filter((field) => terms.every((term) => field.text.toLowerCase().includes(term)))
    .map((field) => field.label);
  const primaryField = fields.find((field) => terms.every((term) => field.text.toLowerCase().includes(term)));

  if (!primaryField) {
    return null;
  }

  return {
    item,
    snippet: createSnippet(primaryField.text, terms),
    matchedFields,
  };
}

function getSearchableFields(item: SiteContentItem): Array<{ label: string; text: string }> {
  return [
    { label: '标题', text: item.title },
    { label: '摘要', text: item.summary ?? '' },
    { label: 'SEO', text: [item.seoTitle ?? '', item.seoDescription ?? ''].join(' ') },
    { label: '分类', text: [...(item.categories ?? []), ...(item.tags ?? []), ...(item.series ?? [])].join(' ') },
    { label: '正文', text: normalizeSnippetSource(item.bodyMarkdown ?? '') },
  ].filter((field) => field.text.trim().length > 0);
}

function normalizeSnippetSource(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createSnippet(text: string, terms: string[]): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  const firstIndex = Math.min(
    ...terms
      .map((term) => lower.indexOf(term))
      .filter((index) => index >= 0),
  );

  if (!Number.isFinite(firstIndex)) {
    return normalized.slice(0, 140);
  }

  const start = Math.max(0, firstIndex - 42);
  const end = Math.min(normalized.length, firstIndex + 118);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < normalized.length ? '...' : '';

  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scoreSearchResult(item: SiteContentItem, terms: string[]): number {
  const title = item.title.toLowerCase();
  const summary = (item.summary ?? '').toLowerCase();
  const seo = [item.seoTitle ?? '', item.seoDescription ?? ''].join(' ').toLowerCase();
  const taxonomy = [...(item.categories ?? []), ...(item.tags ?? []), ...(item.series ?? [])].join(' ').toLowerCase();
  const body = (item.bodyMarkdown ?? '').toLowerCase();
  const combined = [title, summary, seo, taxonomy, body].join(' ');

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

    if (seo.includes(term)) {
      return score + 4;
    }

    if (taxonomy.includes(term)) {
      return score + 3;
    }

    return score + 1;
  }, 0);
}
