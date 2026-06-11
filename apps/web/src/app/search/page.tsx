import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '搜索',
    description: '搜索已发布的文章、笔记、日常和项目。',
    path: '/search',
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const results = query ? await loadSiteContent(undefined, undefined, query) : [];

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Search</p>
          <h1>搜索</h1>
          <p>搜索已发布的文章、笔记、日常和项目。</p>
        </div>
        <form className="search-form" action="/search">
          <input name="q" defaultValue={query} placeholder="输入关键词" aria-label="Search query" />
          <button type="submit">搜索</button>
        </form>
        {query ? <p className="search-summary">找到 {results.length} 条结果</p> : null}
        {query && results.length === 0 ? (
          <p className="empty-state">没有找到匹配内容。</p>
        ) : (
          <div className="content-grid">
            {results.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
