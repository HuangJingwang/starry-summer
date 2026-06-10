export interface NavigationItem {
  href: string;
  label: string;
}

const navigationByKey: Record<string, NavigationItem> = {
  posts: { href: '/posts', label: 'Writing' },
  notes: { href: '/notes', label: 'Notes' },
  moments: { href: '/moments', label: 'Moments' },
  projects: { href: '/projects', label: 'Projects' },
  categories: { href: '/categories', label: 'Categories' },
  archives: { href: '/archives', label: 'Archives' },
  search: { href: '/search', label: 'Search' },
  about: { href: '/about', label: 'About' },
  guestbook: { href: '/guestbook', label: 'Guestbook' },
};

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
