import { cloneElement, isValidElement, type ReactNode } from 'react';

import { MobileBackToTop } from '@/components/MobileBackToTop';
import { ThemeSync } from '@/components/ThemeSync';
import { JournalFooter } from '@/components/JournalFooter';
import { JournalMotion } from '@/components/JournalMotion';

export function SiteShell({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  void hideHeader;
  const content = isValidElement<{ id?: string; tabIndex?: number }>(children) && children.type === 'main'
    ? cloneElement(children, { id: 'main-content', tabIndex: -1 }) : children;

  return (
    <div id="home" className="site-shell journal-shell">
      <ThemeSync />
      <JournalMotion />
      {content}
      <JournalFooter />
      <MobileBackToTop />
    </div>
  );
}
