import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import { getContentHref, getContentTaxonomyLinkGroups, normalizeContentSort, type SiteContentItem } from '@/lib/content';
import { getContentCover } from '@/lib/content-cover';
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
  const groupedPosts = groupPostsByYear(posts);

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
        <div className="posts-archive">
          {groupedPosts.map((group) => (
            <section key={group.year} className="posts-archive-group" aria-label={`${group.year} 年文章`}>
              <header className="posts-archive-group__heading">
                <div>
                  <h2>{group.year}年</h2>
                  <span aria-hidden="true" />
                  <p>{group.items.length} 篇文章</p>
                </div>
              </header>
              <div className="posts-archive-group__list">
                {group.items.map((item) => {
                  const cover = getContentCover(item);
                  const taxonomyItems = getContentTaxonomyLinkGroups(item).flatMap((taxonomyGroup) => taxonomyGroup.items);

                  return (
                    <Link key={item.id} className="posts-archive-item" href={getContentHref(item)}>
                      <time className="posts-archive-item__date" dateTime={item.publishedAt}>
                        {formatPostArchiveDate(item.publishedAt)}
                      </time>
                      <span className="posts-archive-item__dot" aria-hidden="true" />
                      <span className="posts-archive-item__title">
                        {item.title}
                        {item.pinned ? <span className="posts-archive-item__pin">置顶</span> : null}
                      </span>
                      <span className="posts-archive-item__tags" aria-label="文章标签">
                        {taxonomyItems.slice(0, 3).map((taxonomyItem) => (
                          <span key={taxonomyItem.href}>{taxonomyItem.label}</span>
                        ))}
                      </span>
                      <span className="posts-archive-item__stats" aria-label="文章热度">
                        {item.viewCount ?? 0} 浏览 · {item.likeCount ?? 0} 喜欢
                      </span>
                      {cover ? (
                        <span className="posts-archive-item__cover-preview" aria-hidden="true">
                          <img src={cover.imageUrl} alt="" />
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </SiteShell>
  );
}

function groupPostsByYear(posts: SiteContentItem[]): Array<{ year: string; items: SiteContentItem[] }> {
  const groups = new Map<string, SiteContentItem[]>();

  for (const post of posts) {
    const year = post.publishedAt.slice(0, 4) || '未知';
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }

  return [...groups.entries()]
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, items]) => ({ year, items }));
}

function formatPostArchiveDate(value: string): string {
  const [, month = '', day = ''] = value.match(/^(\d{4})-(\d{2})-(\d{2})/) ?? [];

  if (!month || !day) {
    return value;
  }

  return `${month}-${day}`;
}
