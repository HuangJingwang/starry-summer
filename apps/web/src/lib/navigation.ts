export interface NavigationItem {
  href: string;
  label: string;
  children?: NavigationItem[];
}

const navigationByKey: Record<string, NavigationItem> = {
  posts: { href: '/posts', label: '文章' },
  moments: { href: '/moments', label: '日常' },
  projects: { href: '/projects', label: '项目' },
  series: { href: '/series', label: '专题' },
  categories: { href: '/categories', label: '分类' },
  tags: { href: '/tags', label: '标签' },
  archives: { href: '/archives', label: '归档' },
  search: { href: '/search', label: '搜索' },
};

const adminNavigation: NavigationItem[] = [
  { href: '/admin', label: '概览' },
  { href: '/admin/content', label: '内容' },
  { href: '/admin/projects', label: '项目' },
  { href: '/admin/study', label: '学习' },
  {
    href: '/admin/comments',
    label: '互动',
    children: [
      { href: '/admin/comments', label: '评论管理' },
      { href: '/admin/guestbook', label: '留言管理' },
    ],
  },
  { href: '/admin/assets', label: '素材' },
  {
    href: '/admin/settings',
    label: '设置',
    children: [
      { href: '/admin/taxonomy', label: '分类标签' },
      { href: '/admin/export', label: '导入导出' },
      { href: '/admin/settings', label: '站点设置' },
    ],
  },
];

export function buildPublicNavigation(keys: string[]): NavigationItem[] {
  const items: NavigationItem[] = [];
  const seen = new Set<string>();
  const normalizedKeys = keys.map((key) => normalizeNavigationKey(key));

  for (const normalized of normalizedKeys) {
    if (normalized === 'search' || normalized === 'about' || normalized === 'series' || normalized === 'guestbook') {
      continue;
    }

    const item = navigationByKey[normalized];

    if (item && !seen.has(normalized)) {
      items.push(item);
      seen.add(normalized);
    }
  }

  return items;
}

function normalizeNavigationKey(key: string): string {
  const normalized = key.trim().toLowerCase();

  return normalized === 'notes' ? 'posts' : normalized;
}

export function buildAdminNavigation(): NavigationItem[] {
  return adminNavigation;
}
