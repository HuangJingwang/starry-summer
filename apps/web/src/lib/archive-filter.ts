import type { SortableArchiveGroup } from '@/components/ContentArchiveMarkup';

export function buildArchiveSortHref(baseHref: string, sort: 'latest' | 'popular', query = '', tag = '') {
  const params = new URLSearchParams();
  if (sort === 'popular') params.set('sort', sort);
  if (query) params.set('q', query);
  if (tag) params.set('tag', tag);
  return params.size ? `${baseHref}?${params}` : baseHref;
}

export function selectArchivePage(groups: SortableArchiveGroup[], { query = '', tag = '', page = 1 }: { query?: string; tag?: string; page?: number }) {
  const normalized = query.trim().toLocaleLowerCase();
  const filtered = groups.flatMap(group => group.items.map(item => ({ year: group.year, item }))).filter(({ item }) =>
    (!normalized || [item.title, item.excerpt ?? '', ...item.taxonomyItems.map(t => t.label)].some(value => value.toLocaleLowerCase().includes(normalized))) &&
    (!tag || item.taxonomyItems.some(t => t.label === tag)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const current = Math.max(1, Math.min(pages, Number.isFinite(page) ? Math.trunc(page) : 1));
  const selected: SortableArchiveGroup[] = [];
  for (const { year, item } of filtered.slice((current - 1) * 12, current * 12)) {
    const group = selected.find(group => group.year === year);
    if (group) group.items.push(item); else selected.push({ year, items: [item] });
  }
  return { groups: selected, page: current, pages, total: filtered.length };
}
