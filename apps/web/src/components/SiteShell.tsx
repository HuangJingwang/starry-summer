import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/posts', label: 'Writing' },
  { href: '/notes', label: 'Notes' },
  { href: '/moments', label: 'Moments' },
  { href: '/projects', label: 'Projects' },
  { href: '/guestbook', label: 'Guestbook' },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Starry Summer home">
          <span className="brand-mark">S</span>
          <span>Starry Summer</span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="admin-link" href="/admin">
          Admin
        </Link>
      </header>
      {children}
    </div>
  );
}
