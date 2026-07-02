'use client';

import { usePathname } from 'next/navigation';

import { PublicCardNav } from '@/components/PublicCardNav';
import type { NavigationItem } from '@/lib/navigation';

export function PublicPersistentNav({ title, navItems }: { title: string; navItems: NavigationItem[] }) {
  const pathname = usePathname();

  if (shouldHidePublicNav(pathname)) {
    return null;
  }

  return <PublicCardNav title={title} navItems={navItems} />;
}

function shouldHidePublicNav(pathname: string) {
  return pathname === '/' || pathname === '/home' || pathname.startsWith('/admin') || pathname === '/fleet-flagship';
}
