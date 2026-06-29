import type { ReactNode } from 'react';

import { MobileBackToTop } from '@/components/MobileBackToTop';
import { PublicCardNav } from '@/components/PublicCardNav';
import { ThemeSync } from '@/components/ThemeSync';
import { buildPublicNavigation } from '@/lib/navigation';
import { loadSiteSettings } from '@/lib/settings-repository';

export async function SiteShell({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  const settings = await loadSiteSettings();
  const navItems = buildPublicNavigation(settings.navigation);

  return (
    <div id="home" className="site-shell">
      <ThemeSync />
      {hideHeader ? null : <PublicCardNav title={settings.profile.title} navItems={navItems} />}
      {children}
      <MobileBackToTop />
    </div>
  );
}
