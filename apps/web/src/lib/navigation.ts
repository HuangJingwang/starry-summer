export interface NavigationItem {
  href: string;
  label: string;
}

const navigationByKey: Record<string, NavigationItem> = {
  posts: { href: '/posts', label: 'Writing' },
  notes: { href: '/notes', label: 'Notes' },
  moments: { href: '/moments', label: 'Moments' },
  projects: { href: '/projects', label: 'Projects' },
  series: { href: '/series', label: 'Series' },
  categories: { href: '/categories', label: 'Categories' },
  tags: { href: '/tags', label: 'Tags' },
  archives: { href: '/archives', label: 'Archives' },
  search: { href: '/search', label: 'Search' },
  about: { href: '/about', label: 'About' },
  guestbook: { href: '/guestbook', label: 'Guestbook' },
};

const adminNavigation: NavigationItem[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/content/new', label: 'New' },
  { href: '/admin/comments', label: 'Comments' },
  { href: '/admin/guestbook', label: 'Guestbook' },
  { href: '/admin/taxonomy', label: 'Taxonomy' },
  { href: '/admin/assets', label: 'Assets' },
  { href: '/admin/export', label: 'Export' },
  { href: '/admin/settings', label: 'Settings' },
];

export function buildPublicNavigation(keys: string[]): NavigationItem[] {
  const items: NavigationItem[] = [{ href: '/', label: 'Home' }];
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
