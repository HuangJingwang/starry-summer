'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { buildAdminNavigation } from '@/lib/navigation';

import { AdminSessionStatus } from './AdminSessionStatus';
import { ThemeToggle } from './ThemeToggle';

function matchesAdminPath(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
}

export function AdminShell({ children }: { children: ReactNode }) {
  const adminNav = buildAdminNavigation();
  const pathname = usePathname();
  const activeItem =
    adminNav.find((item) => [item, ...(item.children ?? [])].some((link) => matchesAdminPath(pathname, link.href))) ??
    adminNav[0] ??
    { href: '/admin', label: '概览' };
  const activeChildren = activeItem.children ?? [];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          <span className="brand-mark">S</span>
          <span>
            后台
            <small>Light Workbench</small>
          </span>
        </Link>
        <nav className="admin-primary-nav" aria-label="后台主导航">
          {adminNav.map((item) => (
            <Link
              className="admin-nav-link"
              href={item.href}
              aria-current={item.href === activeItem.href ? 'page' : undefined}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {activeChildren.length > 0 ? (
          <nav className="admin-subnav" aria-label={`${activeItem.label}子导航`}>
            <span>{activeItem.label}</span>
            {activeChildren.map((child) => (
              <Link
                data-active={matchesAdminPath(pathname, child.href) ? 'true' : undefined}
                href={child.href}
                key={child.href}
              >
                {child.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="admin-sidebar__footer">
          <div className="admin-frontdesk">
            <Link href="/">
              <span>前台入口</span>
              <small>查看公开站点</small>
            </Link>
          </div>
          <AdminSessionStatus />
        </div>
      </aside>
      <main className="admin-content">
        <div className="admin-command-bar" aria-label="后台快捷操作">
          <div>
            <span>写作</span>
            <strong>内容轻工作台</strong>
          </div>
          <div className="admin-command-bar__actions">
            <Link href="/admin/content/new">新建内容</Link>
            <Link href="/admin/assets">上传素材</Link>
            <ThemeToggle />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
