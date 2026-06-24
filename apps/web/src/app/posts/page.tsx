import { Suspense } from 'react';

import {
  PublicArchiveList,
  groupArchiveItemsByYear,
  toPublicArchiveItems,
  type PublicArchiveLabels,
} from '@/components/PublicArchiveList';
import { PublicArchiveSortClient } from '@/components/PublicArchiveSortClient';
import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

const postArchiveLabels: PublicArchiveLabels = {
  browseAriaLabel: '文章浏览',
  browseHref: '/series',
  browseLabel: '专题',
  groupAriaLabelSuffix: '年文章',
  groupCountSuffix: '篇文章',
  itemStatsAriaLabel: '文章热度',
  itemTaxonomyAriaLabel: '文章标签',
  latestLabel: '最新',
  popularLabel: '热门',
  sortAriaLabel: '文章排序',
};

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
  const latestGroups = groupArchiveItemsByYear(toPublicArchiveItems(latestPosts));
  const popularGroups = groupArchiveItemsByYear(toPublicArchiveItems(popularPosts));

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title-row">
          <div className="page-title">
            <h1>文章</h1>
          </div>
          <Suspense
            fallback={
              <PublicArchiveList basePath="/posts" groups={latestGroups} labels={postArchiveLabels} sort="latest" />
            }
          >
            <PublicArchiveSortClient
              basePath="/posts"
              labels={postArchiveLabels}
              latestGroups={latestGroups}
              popularGroups={popularGroups}
            />
          </Suspense>
        </div>
      </main>
    </SiteShell>
  );
}
