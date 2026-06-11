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
          <span>后台</span>
        </Link>
        <nav aria-label="后台导航">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="admin-home-link" href="/">
          查看站点
        </Link>
        <AdminSessionStatus />
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
