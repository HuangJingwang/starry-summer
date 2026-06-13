import { getPublicContent } from './content-public';
import type {
  ContentCategoryGroup,
  ContentSeriesGroup,
  ContentTagGroup,
  ContentTaxonomyGroup,
  ContentTaxonomyLinkGroup,
  SiteContentItem,
} from './content-types';

export function getContentTaxonomyGroups(item: Pick<SiteContentItem, 'categories' | 'tags'>): ContentTaxonomyGroup[] {
  return [
    { label: '分类', ariaLabel: '分类', items: normalizeTaxonomyItems(item.categories) },
    { label: '标签', ariaLabel: '标签', items: normalizeTaxonomyItems(item.tags) },
  ].filter((group) => group.items.length > 0);
}

export function getContentTaxonomyLinkGroups(item: Pick<SiteContentItem, 'categories' | 'tags'>): ContentTaxonomyLinkGroup[] {
  return [
    {
      label: '分类',
      ariaLabel: '分类',
      items: normalizeTaxonomyItems(item.categories).map((category) => ({
        label: category,
        href: getCategoryHref(category),
      })),
    },
    {
      label: '标签',
      ariaLabel: '标签',
      items: normalizeTaxonomyItems(item.tags).map((tag) => ({
        label: tag,
        href: getTagHref(tag),
      })),
    },
  ].filter((group) => group.items.length > 0);
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

export function getContentByCategorySlug(items: SiteContentItem[], slug: string): ContentCategoryGroup | null {
  return groupContentByCategory(items).find((group) => group.key === slug) ?? null;
}

export function getCategoryHref(category: string): string {
  return `/categories/${slugifyTaxonomyLabel(category)}`;
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

export function groupContentByTag(items: SiteContentItem[]): ContentTagGroup[] {
  const groups = new Map<string, ContentTagGroup>();

  for (const item of getPublicContent(items)) {
    const tagLabels = new Set(item.tags?.map((tag) => tag.trim()).filter(Boolean) ?? []);

    for (const tag of tagLabels) {
      const key = slugifyTaxonomyLabel(tag);
      const group = groups.get(key) ?? { key, label: tag, items: [] };
      group.items.push(item);
      groups.set(key, group);
    }
  }

  return [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
}

export function getContentByTagSlug(items: SiteContentItem[], slug: string): ContentTagGroup | null {
  return groupContentByTag(items).find((group) => group.key === slug) ?? null;
}

export function getTagHref(tag: string): string {
  return `/tags/${slugifyTaxonomyLabel(tag)}`;
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
