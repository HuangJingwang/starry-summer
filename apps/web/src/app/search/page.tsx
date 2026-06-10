import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { searchContent } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const content = await loadSiteContent();
  const results = searchContent(content, q);

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Search</p>
          <h1>搜索</h1>
          <p>搜索已发布的文章、笔记、日常和项目。</p>
        </div>
        <form className="search-form" action="/search">
          <input name="q" defaultValue={q} placeholder="输入关键词" aria-label="Search query" />
          <button type="submit">搜索</button>
        </form>
        <div className="content-grid">
          {results.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
