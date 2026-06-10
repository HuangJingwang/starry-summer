import { describe, expect, test } from 'vitest';

import { buildAdminNavigation, buildPublicNavigation } from './navigation';

describe('public navigation helpers', () => {
  test('always keeps home and maps configured navigation keys', () => {
    expect(buildPublicNavigation(['posts', 'projects', 'series', 'tags', 'guestbook'])).toEqual([
      { href: '/', label: 'Home' },
      { href: '/posts', label: 'Writing' },
      { href: '/projects', label: 'Projects' },
      { href: '/series', label: 'Series' },
      { href: '/tags', label: 'Tags' },
      { href: '/guestbook', label: 'Guestbook' },
    ]);
  });

  test('ignores unknown duplicate and blank navigation keys', () => {
    expect(buildPublicNavigation([' posts ', 'unknown', 'posts', '', 'search', 'about'])).toEqual([
      { href: '/', label: 'Home' },
      { href: '/posts', label: 'Writing' },
      { href: '/search', label: 'Search' },
      { href: '/about', label: 'About' },
    ]);
  });
});

describe('admin navigation helpers', () => {
  test('includes project management alongside core admin sections', () => {
    expect(buildAdminNavigation()).toEqual([
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
    ]);
  });
});
