import type { Metadata } from 'next';

import { loadSiteContent } from '@/lib/public-content';
import { EditorialHome } from '@/components/EditorialHome';
import { SiteShell } from '@/components/SiteShell';
import { selectEditorialHome } from '@/lib/editorial-home';

export const metadata: Metadata = {
  title: 'Starry Summer · Aster.H 的个人博客',
  description: '文章、笔记、片刻与项目。Aster.H 的个人内容平台。',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export default async function HomePage() {
  const content = await loadSiteContent();
  return <SiteShell><EditorialHome {...selectEditorialHome(content)} /></SiteShell>;
}
