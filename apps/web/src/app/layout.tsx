import type { Metadata } from 'next';

import { buildSiteMetadata, normalizePublicSiteUrl } from '@/lib/seo';
import { loadPublicSettings } from '@/lib/settings';
import './styles.css';
import './styles/admin.css';
import './styles/responsive.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadPublicSettings(undefined, {
    apiBaseUrl: process.env.API_BASE_URL,
  });

  return buildSiteMetadata(settings, normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL));
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
