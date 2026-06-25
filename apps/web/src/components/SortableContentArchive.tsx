'use client';

import { useSearchParams } from 'next/navigation';

import {
  ContentArchiveActions,
  ContentArchiveMarkup,
  type SortableArchiveGroup,
} from '@/components/ContentArchiveMarkup';

export type { SortableArchiveGroup };

interface SortableContentArchiveProps {
  latestGroups: SortableArchiveGroup[];
  popularGroups: SortableArchiveGroup[];
  contentLabel: string;
  sortAriaLabel: string;
  browseAriaLabel: string;
  browseHref: string;
  browseLabel: string;
  baseHref: string;
}

export function SortableContentArchive({
  latestGroups,
  popularGroups,
  contentLabel,
  sortAriaLabel,
  browseAriaLabel,
  browseHref,
  browseLabel,
  baseHref,
}: SortableContentArchiveProps) {
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest';
  const groups = sort === 'popular' ? popularGroups : latestGroups;

  return (
    <>
      <ContentArchiveActions
        sort={sort}
        sortAriaLabel={sortAriaLabel}
        browseAriaLabel={browseAriaLabel}
        browseHref={browseHref}
        browseLabel={browseLabel}
        baseHref={baseHref}
      />
      <ContentArchiveMarkup groups={groups} contentLabel={contentLabel} />
    </>
  );
}
