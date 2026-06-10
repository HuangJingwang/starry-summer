import { describe, expect, test } from 'vitest';

import { buildPublicNavigation } from './navigation';

describe('public navigation helpers', () => {
  test('always keeps home and maps configured navigation keys', () => {
    expect(buildPublicNavigation(['posts', 'projects', 'guestbook'])).toEqual([
      { href: '/', label: 'Home' },
      { href: '/posts', label: 'Writing' },
      { href: '/projects', label: 'Projects' },
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
