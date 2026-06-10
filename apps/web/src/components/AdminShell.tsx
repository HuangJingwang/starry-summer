import Link from 'next/link';
import type { ReactNode } from 'react';

import { buildAdminNavigation } from '@/lib/navigation';

import { AdminSessionStatus } from './AdminSessionStatus';

export function AdminShell({ children }: { children: ReactNode }) {
  const adminNav = buildAdminNavigation();

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
