export interface NavigationItem {
  href: string;
  label: string;
}

const navigationByKey: Record<string, NavigationItem> = {
  posts: { href: '/posts', label: '文章' },
  notes: { href: '/notes', label: '笔记' },
  moments: { href: '/moments', label: '日常' },
  projects: { href: '/projects', label: '项目' },
  series: { href: '/series', label: '专题' },
  categories: { href: '/categories', label: '分类' },
  tags: { href: '/tags', label: '标签' },
  archives: { href: '/archives', label: '归档' },
  search: { href: '/search', label: '搜索' },
  about: { href: '/about', label: '关于' },
  guestbook: { href: '/guestbook', label: '留言' },
};

const adminNavigation: NavigationItem[] = [
  { href: '/admin', label: '概览' },
  { href: '/admin/content', label: '内容管理' },
  { href: '/admin/projects', label: '项目管理' },
  { href: '/admin/content/new', label: '新建内容' },
  { href: '/admin/comments', label: '评论管理' },
  { href: '/admin/guestbook', label: '留言审核' },
  { href: '/admin/taxonomy', label: '分类标签' },
  { href: '/admin/assets', label: '素材管理' },
  { href: '/admin/export', label: '导入导出' },
  { href: '/admin/settings', label: '站点设置' },
];

export function buildPublicNavigation(keys: string[]): NavigationItem[] {
  const items: NavigationItem[] = [{ href: '/', label: '首页' }];
  const seen = new Set<string>();

  for (const key of keys) {
    const normalized = key.trim().toLowerCase();
    const item = navigationByKey[normalized];

    if (item && !seen.has(normalized)) {
      items.push(item);
      seen.add(normalized);
    }
  }

  return items;
}

export function buildAdminNavigation(): NavigationItem[] {
  return adminNavigation;
}
