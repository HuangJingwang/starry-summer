'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { selectArchivePage } from '@/lib/archive-filter';

import {
  ContentArchiveActions,
  ContentArchiveMarkup,
  type SortableArchiveGroup,
} from '@/components/ContentArchiveMarkup';

export type { SortableArchiveGroup };

interface SortableContentArchiveProps {
  latestGroups: SortableArchiveGroup[];
  popularGroups: SortableArchiveGroup[];
  contentLabel: string;
  sortAriaLabel: string;
  browseAriaLabel: string;
  browseHref: string;
  browseLabel: string;
  baseHref: string;
}

export function SortableContentArchive({
  latestGroups,
  popularGroups,
  contentLabel,
  sortAriaLabel,
  browseAriaLabel,
  browseHref,
  browseLabel,
  baseHref,
}: SortableContentArchiveProps) {
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest';
  const groups = sort === 'popular' ? popularGroups : latestGroups;
  const query = searchParams.get('q') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const result = selectArchivePage(groups, { query, tag, page: Number(searchParams.get('page') ?? 1) });
  const tags = [...new Set(latestGroups.flatMap(group => group.items.flatMap(item => item.taxonomyItems.map(t => t.label))))];
  function pageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `${baseHref}?${params}`;
  }

  return (
    <>
      <ContentArchiveActions
        query={query}
        tag={tag}
        sort={sort}
        sortAriaLabel={sortAriaLabel}
        browseAriaLabel={browseAriaLabel}
        browseHref={browseHref}
        browseLabel={browseLabel}
        baseHref={baseHref}
      />
      <form className="editorial-archive-filter" action={baseHref} key={`${query}:${tag}:${sort}`}>
        <input type="hidden" name="sort" value={sort} />
        <label><span>查找{contentLabel}</span><input type="search" name="q" defaultValue={query} placeholder="标题、摘要或标签" /></label>
        <label><span>分类与标签</span><select name="tag" defaultValue={tag}><option value="">全部主题</option>{tags.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <button type="submit">筛选</button>
        {(query || tag) && <Link href={baseHref}>清除</Link>}
      </form>
      <p className="resource-results" role="status">{result.total} 篇{contentLabel}</p>
      {result.total ? <ContentArchiveMarkup groups={result.groups} contentLabel={contentLabel} /> : <p className="editorial-empty">没有找到相关{contentLabel}，试试其他关键词。</p>}
      {result.pages > 1 && <nav className="editorial-pagination" aria-label={`${contentLabel}分页`}>
        {result.page > 1 && <Link href={pageHref(result.page - 1)}>上一页</Link>}
        {Array.from({ length: result.pages }, (_, i) => <Link key={i} href={pageHref(i + 1)} aria-label={`第 ${i + 1} 页`} aria-current={result.page === i + 1 ? 'page' : undefined}>{i + 1}</Link>)}
        {result.page < result.pages && <Link href={pageHref(result.page + 1)}>下一页</Link>}
      </nav>}
    </>
  );
}
