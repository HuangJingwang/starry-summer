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

const noteArchiveLabels: PublicArchiveLabels = {
  browseAriaLabel: '笔记浏览',
  browseHref: '/archives',
  browseLabel: '归档',
  groupAriaLabelSuffix: '年笔记',
  groupCountSuffix: '篇笔记',
  itemStatsAriaLabel: '笔记热度',
  itemTaxonomyAriaLabel: '笔记标签',
  latestLabel: '最新',
  popularLabel: '热门',
  sortAriaLabel: '笔记排序',
};

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '笔记',
    description: '更短的记录、阶段性备忘和正在生长的想法。',
    path: '/notes',
  });
}

export default async function NotesPage() {
  const [latestNotes, popularNotes] = await Promise.all([
    loadSiteContent('note', 'latest'),
    loadSiteContent('note', 'popular'),
  ]);
  const latestGroups = groupArchiveItemsByYear(toPublicArchiveItems(latestNotes));
  const popularGroups = groupArchiveItemsByYear(toPublicArchiveItems(popularNotes));

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title-row">
          <div className="page-title">
            <h1>笔记</h1>
          </div>
          <Suspense
            fallback={
              <PublicArchiveList basePath="/notes" groups={latestGroups} labels={noteArchiveLabels} sort="latest" />
            }
          >
            <PublicArchiveSortClient
              basePath="/notes"
              labels={noteArchiveLabels}
              latestGroups={latestGroups}
              popularGroups={popularGroups}
            />
          </Suspense>
        </div>
      </main>
    </SiteShell>
  );
}
