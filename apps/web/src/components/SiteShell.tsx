import Link from 'next/link';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
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
    <div id="top" className="site-shell">
      <header className="site-header site-nav-card">
        <Link className="brand site-nav-card__brand" href="/#top" aria-label={`${settings.profile.title} 首页`}>
          <span className="brand-mark">S</span>
          <span>{settings.profile.title}</span>
        </Link>
        <div className="site-nav-card__body">
          <span className="site-nav-card__group-label">General</span>
          <nav className="site-nav" aria-label="主导航">
            <div className="site-nav__items">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <div className="site-header__tools">
          <form className="site-search" action="/search" role="search" aria-label="站内搜索">
            <input name="q" type="search" enterKeyHint="search" placeholder="搜索" aria-label="站内搜索" />
            <button type="submit">搜索</button>
          </form>
          <ThemeToggle />
        </div>
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
