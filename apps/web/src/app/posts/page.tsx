import { Suspense } from 'react';
import { formatArchiveDate } from '@/lib/archive-date';

import { ContentArchiveActions, ContentArchiveMarkup } from '@/components/ContentArchiveMarkup';
import { SiteShell } from '@/components/SiteShell';
import { SortableContentArchive, type SortableArchiveGroup } from '@/components/SortableContentArchive';
import { getContentHref, getContentTaxonomyLinkGroups, type SiteContentItem } from '@/lib/content';
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

export default async function PostsPage() {
  const [latestPosts, popularPosts] = await Promise.all([
    loadSiteContent('article', 'latest'),
    loadSiteContent('article', 'popular'),
  ]);
  const latestGroups = groupPostsByYear(latestPosts);
  const popularGroups = groupPostsByYear(popularPosts);

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title-row">
          <div className="page-title">
            <p className="eyebrow">01 / THE JOURNAL</p>
            <h1>文章</h1>
            <p>技术实践、原理探索，以及那些值得认真聊聊的事。</p>
          </div>
          <div className="journal-heading-note"><b>{latestPosts.length}</b>公开文章 / 持续更新</div>
        </div>
        <Suspense
          fallback={
            <>
              <ContentArchiveActions
                sort="latest"
                sortAriaLabel="文章排序"
                browseAriaLabel="文章浏览"
                browseHref="/series"
                browseLabel="专题"
                baseHref="/posts"
              />
              <ContentArchiveMarkup groups={latestGroups} contentLabel="文章" />
            </>
          }
        >
          <SortableContentArchive
            latestGroups={latestGroups}
            popularGroups={popularGroups}
            contentLabel="文章"
            sortAriaLabel="文章排序"
            browseAriaLabel="文章浏览"
            browseHref="/series"
            browseLabel="专题"
            baseHref="/posts"
          />
        </Suspense>
      </main>
    </SiteShell>
  );
}

function groupPostsByYear(posts: SiteContentItem[]): SortableArchiveGroup[] {
  const groups = new Map<string, SortableArchiveGroup['items']>();

  for (const post of posts) {
    const year = post.publishedAt.slice(0, 4) || '未知';
    groups.set(year, [...(groups.get(year) ?? []), toArchiveItem(post)]);
  }

  return [...groups.entries()]
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, items]) => ({ year, items }));
}

function toArchiveItem(item: SiteContentItem): SortableArchiveGroup['items'][number] {
  const cover = getContentCover(item);
  const taxonomyItems = getContentTaxonomyLinkGroups(item).flatMap((taxonomyGroup) => taxonomyGroup.items);

  return {
    id: item.id,
    href: getContentHref(item),
    dateLabel: formatArchiveDate(item.publishedAt),
    dateTime: item.publishedAt,
    title: item.title,
    excerpt: item.summary,
    pinned: Boolean(item.pinned),
    taxonomyItems,
    statsLabel: `${item.viewCount ?? 0} 浏览 · ${item.likeCount ?? 0} 喜欢`,
    ...(cover ? { cover: { imageUrl: cover.imageUrl } } : {}),
  };
}
