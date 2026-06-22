import type { Metadata } from 'next';

import { buildSiteMetadata, resolvePublicSiteUrl } from '@/lib/seo';
import { loadSiteSettings } from '@/lib/settings-repository';
import './styles.css';
import './styles/admin.css';
import './styles/responsive.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSiteSettings();

  return buildSiteMetadata(
    settings,
    resolvePublicSiteUrl({
      configuredUrl: process.env.PUBLIC_SITE_URL,
      productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    }),
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.cn" />
        <link rel="preconnect" href="https://fonts.gstatic.cn" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.cn/css2?family=Averia+Gruesa+Libre&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
