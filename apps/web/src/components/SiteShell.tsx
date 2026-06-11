import Link from 'next/link';
import type { ReactNode } from 'react';

import { buildPublicNavigation } from '@/lib/navigation';
import { buildSiteFooterModel } from '@/lib/site-shell';
import type { SiteSettings } from '@/lib/settings';
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
        <nav className="site-nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="admin-link" href="/admin">
          后台
        </Link>
      </header>
      {children}
      <SiteFooter settings={settings} />
    </div>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const footer = buildSiteFooterModel(settings);

  return (
    <footer className="site-footer">
      <div>
        <strong>{footer.title}</strong>
        <span>{footer.ownerName}</span>
      </div>
      <p>{footer.description}</p>
      <nav aria-label="页脚链接">
        {footer.links.map((link) => (
          <a
            key={`${link.label}-${link.href}`}
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noreferrer' : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
