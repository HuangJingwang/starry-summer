import { getPublicContent } from './content-public';
import type { ContentArchiveGroup, SiteContentItem } from './content-types';

export function groupContentByMonth(items: SiteContentItem[]): ContentArchiveGroup[] {
  const groups = new Map<string, SiteContentItem[]>();

  for (const item of getPublicContent(items)) {
    const key = item.publishedAt.slice(0, 7);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, groupItems]) => {
    const [year, month] = key.split('-');

    return {
      key,
      label: `${year} 年 ${month} 月`,
      items: groupItems,
    };
  });
}
