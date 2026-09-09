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
  const latestGroups = groupNotesByYear(latestNotes);
  const popularGroups = groupNotesByYear(popularNotes);

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title-row">
          <div className="page-title">
            <p className="eyebrow">02 / FIELD NOTES</p>
            <h1>笔记</h1>
            <p>还没写成长文的发现，和留给以后自己的线索。</p>
          </div>
          <div className="journal-heading-note"><b>{latestNotes.length}</b>则笔记 / 随时记录</div>
        </div>
        <Suspense
          fallback={
            <>
              <ContentArchiveActions
                sort="latest"
                sortAriaLabel="笔记排序"
                browseAriaLabel="笔记浏览"
                browseHref="/archives"
                browseLabel="归档"
                baseHref="/notes"
              />
              <ContentArchiveMarkup groups={latestGroups} contentLabel="笔记" />
            </>
          }
        >
          <SortableContentArchive
            latestGroups={latestGroups}
            popularGroups={popularGroups}
            contentLabel="笔记"
            sortAriaLabel="笔记排序"
            browseAriaLabel="笔记浏览"
            browseHref="/archives"
            browseLabel="归档"
            baseHref="/notes"
          />
        </Suspense>
        {latestNotes.length === 0 && <div className="journal-empty"><p>笔记还在慢慢积累。先看看已经整理好的文章吧。</p><a href="/posts">去读文章 ↗</a></div>}
      </main>
    </SiteShell>
  );
}

function groupNotesByYear(notes: SiteContentItem[]): SortableArchiveGroup[] {
  const groups = new Map<string, SortableArchiveGroup['items']>();

  for (const note of notes) {
    const year = note.publishedAt.slice(0, 4) || '未知';
    groups.set(year, [...(groups.get(year) ?? []), toArchiveItem(note)]);
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
