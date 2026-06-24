'use client';

import { useSearchParams } from 'next/navigation';

import { normalizeContentSort } from '@/lib/content';
import { PublicArchiveList, type PublicArchiveGroup, type PublicArchiveLabels } from './PublicArchiveList';

export function PublicArchiveSortClient({
  basePath,
  labels,
  latestGroups,
  popularGroups,
}: {
  basePath: string;
  labels: PublicArchiveLabels;
  latestGroups: PublicArchiveGroup[];
  popularGroups: PublicArchiveGroup[];
}) {
  const searchParams = useSearchParams();
  const sort = normalizeContentSort(searchParams.get('sort'));
  const groups = sort === 'popular' ? popularGroups : latestGroups;

  return <PublicArchiveList basePath={basePath} groups={groups} labels={labels} sort={sort} />;
}
