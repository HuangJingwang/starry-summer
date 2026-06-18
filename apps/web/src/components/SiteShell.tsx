import type { ReactNode } from 'react';

import { MobileBackToTop } from '@/components/MobileBackToTop';
import { PublicCardNav } from '@/components/PublicCardNav';
import { StarrySkyCanvas } from '@/components/StarrySkyCanvas';
import { buildPublicNavigation } from '@/lib/navigation';
import { loadSiteSettings } from '@/lib/settings-repository';

export async function SiteShell({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  const settings = await loadSiteSettings();
  const navItems = buildPublicNavigation(settings.navigation);

  return (
    <div id="top" className="site-shell">
      {hideHeader ? null : <StarrySkyCanvas className="site-shell__canvas" showFleet={false} />}
      {hideHeader ? null : <PublicCardNav title={settings.profile.title} navItems={navItems} />}
      {children}
      <MobileBackToTop />
    </div>
  );
}
