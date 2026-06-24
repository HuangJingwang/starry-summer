import Link from 'next/link';

import { getContentTaxonomyLinkGroups, type SiteContentItem } from '@/lib/content';
import { getContentCover } from '@/lib/content-cover';

export type PublicArchiveItem = Pick<
  SiteContentItem,
  | 'categories'
  | 'coverAltText'
  | 'coverImageUrl'
  | 'id'
  | 'likeCount'
  | 'pinned'
  | 'publishedAt'
  | 'series'
  | 'slug'
  | 'tags'
  | 'title'
  | 'type'
  | 'viewCount'
>;

export interface PublicArchiveGroup {
  year: string;
  items: PublicArchiveItem[];
}

export interface PublicArchiveLabels {
  sortAriaLabel: string;
  browseAriaLabel: string;
  browseHref: string;
  browseLabel: string;
  latestLabel: string;
  popularLabel: string;
  groupAriaLabelSuffix: string;
  groupCountSuffix: string;
  itemTaxonomyAriaLabel: string;
  itemStatsAriaLabel: string;
}

export function toPublicArchiveItems(items: SiteContentItem[]): PublicArchiveItem[] {
  return items.map((item) => ({
    categories: item.categories,
    coverAltText: item.coverAltText,
    coverImageUrl: item.coverImageUrl,
    id: item.id,
    likeCount: item.likeCount,
    pinned: item.pinned,
    publishedAt: item.publishedAt,
    series: item.series,
    slug: item.slug,
    tags: item.tags,
    title: item.title,
    type: item.type,
    viewCount: item.viewCount,
  }));
}

export function groupArchiveItemsByYear(items: PublicArchiveItem[]): PublicArchiveGroup[] {
  const groups = new Map<string, PublicArchiveItem[]>();

  for (const item of items) {
    const year = item.publishedAt.slice(0, 4) || '未知';
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }

  return [...groups.entries()]
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, groupedItems]) => ({ year, items: groupedItems }));
}

export function PublicArchiveList({
  basePath,
  groups,
  labels,
  sort,
}: {
  basePath: string;
  groups: PublicArchiveGroup[];
  labels: PublicArchiveLabels;
  sort: 'latest' | 'popular';
}) {
  return (
    <>
      <div className="posts-page-actions">
        <nav className="sort-tabs" aria-label={labels.sortAriaLabel}>
          <Link href={basePath} aria-current={sort === 'latest' ? 'page' : undefined}>
            {labels.latestLabel}
          </Link>
          <Link href={`${basePath}?sort=popular`} aria-current={sort === 'popular' ? 'page' : undefined}>
            {labels.popularLabel}
          </Link>
        </nav>
        <nav className="sort-tabs" aria-label={labels.browseAriaLabel}>
          <Link href={labels.browseHref}>{labels.browseLabel}</Link>
        </nav>
      </div>
      <div className="posts-archive">
        {groups.map((group) => (
          <section key={group.year} className="posts-archive-group" aria-label={`${group.year} ${labels.groupAriaLabelSuffix}`}>
            <header className="posts-archive-group__heading">
              <div>
                <h2>{group.year}年</h2>
                <span aria-hidden="true" />
                <p>
                  {group.items.length} {labels.groupCountSuffix}
                </p>
              </div>
            </header>
            <div className="posts-archive-group__list">
              {group.items.map((item) => {
                const cover = getContentCover(item);
                const taxonomyItems = getContentTaxonomyLinkGroups(item).flatMap((taxonomyGroup) => taxonomyGroup.items);

                return (
                  <Link key={item.id} className="posts-archive-item" href={getArchiveItemHref(item)}>
                    <time className="posts-archive-item__date" dateTime={item.publishedAt}>
                      {formatArchiveDate(item.publishedAt)}
                    </time>
                    <span className="posts-archive-item__dot" aria-hidden="true" />
                    <span className="posts-archive-item__title">
                      {item.title}
                      {item.pinned ? <span className="posts-archive-item__pin">置顶</span> : null}
                    </span>
                    <span className="posts-archive-item__tags" aria-label={labels.itemTaxonomyAriaLabel}>
                      {taxonomyItems.slice(0, 3).map((taxonomyItem) => (
                        <span key={taxonomyItem.href}>{taxonomyItem.label}</span>
                      ))}
                    </span>
                    <span className="posts-archive-item__stats" aria-label={labels.itemStatsAriaLabel}>
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
    </>
  );
}

function formatArchiveDate(value: string): string {
  const [, month = '', day = ''] = value.match(/^(\d{4})-(\d{2})-(\d{2})/) ?? [];

  if (!month || !day) {
    return value;
  }

  return `${month}-${day}`;
}

function getArchiveItemHref(item: PublicArchiveItem): string {
  const slug = item.slug ?? item.id;
  const segmentByType: Record<PublicArchiveItem['type'], string> = {
    moment: 'moments',
    note: 'posts',
    page: 'pages',
    post: 'posts',
    project: 'projects',
  };

  return `/${segmentByType[item.type]}/${slug}`;
}
