import Link from 'next/link';
import type { ReactNode } from 'react';

import { AdminSessionStatus } from './AdminSessionStatus';

const adminNav = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/content/new', label: 'New' },
  { href: '/admin/comments', label: 'Comments' },
  { href: '/admin/guestbook', label: 'Guestbook' },
  { href: '/admin/taxonomy', label: 'Taxonomy' },
  { href: '/admin/assets', label: 'Assets' },
  { href: '/admin/export', label: 'Export' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          <span className="brand-mark">S</span>
          <span>Admin</span>
        </Link>
        <nav aria-label="Admin navigation">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="admin-home-link" href="/">
          View site
        </Link>
        <AdminSessionStatus />
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
