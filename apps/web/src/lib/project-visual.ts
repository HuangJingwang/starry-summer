import { getContentCover } from './content-cover';
import type { SiteContentItem } from './content-types';

// Actual screenshots; original content cover metadata remains untouched.
export function getProjectVisual(item: SiteContentItem) {
  if (item.type === 'project' && item.slug === 'starry-summer') return { imageUrl: '/images/projects/aster-home-avatar.webp', altText: 'Aster 个人博客首页截图', isDefault: false };
  if (item.type === 'project' && item.slug === 'brushup') return { imageUrl: '/images/projects/brushup-dashboard.webp', altText: 'BrushUp 仓库提供的 Dashboard 实际界面截图', isDefault: false };
  return getContentCover(item);
}
