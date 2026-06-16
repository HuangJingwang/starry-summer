import Link from 'next/link';

import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { normalizeContentSort } from '@/lib/content';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '文章',
    description: '长文、教程、观点和阶段性复盘。',
    path: '/posts',
  });
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort = normalizeContentSort(sortParam);
  const posts = await loadSiteContent('article', sort);

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title-row">
          <div className="page-title">
            <h1>文章</h1>
          </div>
          <div className="posts-page-actions">
            <nav className="sort-tabs" aria-label="文章排序">
              <Link href="/posts" aria-current={sort === 'latest' ? 'page' : undefined}>
                最新
              </Link>
              <Link href="/posts?sort=popular" aria-current={sort === 'popular' ? 'page' : undefined}>
                热门
              </Link>
            </nav>
            <nav className="sort-tabs" aria-label="文章浏览">
              <Link href="/series">专题</Link>
            </nav>
          </div>
        </div>
        <div className="content-grid">
          {posts.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
