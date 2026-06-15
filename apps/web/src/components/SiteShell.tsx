import type { ReactNode } from 'react';

import { PublicCardNav } from '@/components/PublicCardNav';
import { buildPublicNavigation } from '@/lib/navigation';
import { loadSiteSettings } from '@/lib/settings-repository';

export async function SiteShell({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  const settings = await loadSiteSettings();
  const navItems = buildPublicNavigation(settings.navigation);

  return (
    <div id="top" className="site-shell">
      {hideHeader ? null : <PublicCardNav title={settings.profile.title} navItems={navItems} />}
      {children}
    </div>
  );
}
