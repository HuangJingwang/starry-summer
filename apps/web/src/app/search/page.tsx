import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import {
  buildSearchResultPreviews,
  formatPublicContentType,
  getContentHref,
  normalizeSearchContentKind,
  splitHighlightedSearchText,
  type SearchContentKind,
} from '@/lib/content';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '搜索',
    description: '搜索已发布的文章、日常和项目。',
    path: '/search',
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q = '', type } = await searchParams;
  const query = q.trim();
  const scope = normalizeSearchContentKind(type);
  const contentKind = scope === 'all' ? undefined : scope;
  const results = query ? await loadSiteContent(contentKind, undefined, query) : [];
  const previews = buildSearchResultPreviews(results, query);

  return (
    <SiteShell>
      <main className="page-main search-page">
        <div className="page-title">
          <p className="eyebrow">搜索</p>
          <h1>搜索</h1>
          <p>搜索已发布的文章、日常和项目。</p>
        </div>
        <form className="search-form" action="/search" role="search" aria-label="站内搜索">
          <input name="q" type="search" enterKeyHint="search" defaultValue={query} placeholder="输入关键词" aria-label="搜索关键词" />
          {scope !== 'all' ? (
            <input name="type" type="hidden" value={scope} />
          ) : null}
          <button type="submit">搜索</button>
        </form>
        <nav className="search-scope-tabs" aria-label="搜索范围">
          {searchScopes.map((option) => (
            <Link
              key={option.value}
              href={buildSearchScopeHref(query, option.value)}
              aria-current={scope === option.value ? 'page' : undefined}
            >
              {option.label}
            </Link>
          ))}
        </nav>
        {query ? (
          <p className="search-summary" role="status" aria-live="polite">
            在{searchScopes.find((option) => option.value === scope)?.label ?? '全部'}中找到 {previews.length} 条相关结果
          </p>
        ) : null}
        {!query ? (
          <p className="empty-state" role="status" aria-live="polite">输入关键词后开始搜索。</p>
        ) : query && previews.length === 0 ? (
          <p className="empty-state" role="status" aria-live="polite">没有找到匹配内容。</p>
        ) : previews.length > 0 ? (
          <ol className="search-result-list" aria-label="搜索结果">
            {previews.map((result) => (
              <li key={result.item.id} className="search-result-card">
                <div className="search-result-card__meta">
                  <span>{formatPublicContentType(result.item.type)}</span>
                  <time dateTime={result.item.publishedAt}>{result.item.publishedAt}</time>
                </div>
                <h2>
                  <Link href={getContentHref(result.item)}>
                    <SearchHighlight text={result.item.title} query={query} />
                  </Link>
                </h2>
                <p className="search-result-snippet">
                  <SearchHighlight text={result.snippet} query={query} />
                </p>
                <div className="search-hit-fields" aria-label="命中字段">
                  {result.matchedFields.map((field) => (
                    <span key={field} className="search-hit-field">
                      命中：{field}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </main>
    </SiteShell>
  );
}

const searchScopes: Array<{ label: string; value: SearchContentKind }> = [
  { label: '全部', value: 'all' },
  { label: '文章', value: 'article' },
  { label: '日常', value: 'moment' },
  { label: '项目', value: 'project' },
];

function buildSearchScopeHref(query: string, scope: SearchContentKind): string {
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
  }

  if (scope !== 'all') {
    params.set('type', scope);
  }

  const suffix = params.toString();

  return suffix ? `/search?${suffix}` : '/search';
}

function SearchHighlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitHighlightedSearchText(text, query).map((part, index) =>
        part.highlighted ? <mark key={`${part.text}-${index}`}>{part.text}</mark> : <span key={`${part.text}-${index}`}>{part.text}</span>,
      )}
    </>
  );
}
