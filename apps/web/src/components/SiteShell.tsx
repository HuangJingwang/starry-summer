import Link from 'next/link';
import type { ReactNode } from 'react';

import { buildPublicNavigation } from '@/lib/navigation';
import { loadPublicSettings } from '@/lib/settings';

export async function SiteShell({ children }: { children: ReactNode }) {
  const settings = await loadPublicSettings(undefined, {
    apiBaseUrl: process.env.API_BASE_URL,
  });
  const navItems = buildPublicNavigation(settings.navigation);

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label={`${settings.profile.title} home`}>
          <span className="brand-mark">S</span>
          <span>{settings.profile.title}</span>
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
