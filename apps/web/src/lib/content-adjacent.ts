import { getPublicContent } from './content-public';
import type { AdjacentContent, PublicContentKind, SiteContentItem } from './content-types';

export function getAdjacentContent(items: SiteContentItem[], currentId: string): AdjacentContent {
  const current = getPublicContent(items).find((item) => item.id === currentId);

  if (!current) {
    return { previous: null, next: null };
  }

  const timeline = [...getPublicContent(items, getPublicContentKindForAdjacent(current))].reverse();
  const index = timeline.findIndex((item) => item.id === currentId);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: timeline[index - 1] ?? null,
    next: timeline[index + 1] ?? null,
  };
}

function getPublicContentKindForAdjacent(item: SiteContentItem): PublicContentKind {
  return item.type === 'post' || item.type === 'note' ? 'article' : item.type;
}
