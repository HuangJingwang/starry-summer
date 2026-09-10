import { getPublicContent } from './content-public';
import type { SiteContentItem } from './content-types';

export function selectEditorialHome(content: SiteContentItem[]) {
  const visible = getPublicContent(content).slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return {
    articles: visible.filter(item => item.type === 'post' || item.type === 'note').slice(0, 4),
    projects: visible.filter(item => item.type === 'project'),
  };
}
