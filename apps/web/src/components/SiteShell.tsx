import type { ReactNode } from 'react';

import { MobileBackToTop } from '@/components/MobileBackToTop';
import { ThemeSync } from '@/components/ThemeSync';

export function SiteShell({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  void hideHeader;

  return (
    <div id="home" className="site-shell">
      <ThemeSync />
      {children}
      <MobileBackToTop />
    </div>
  );
}
