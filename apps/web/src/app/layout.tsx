import type { Metadata } from 'next';

import { buildSiteMetadata, normalizePublicSiteUrl } from '@/lib/seo';
import { loadSiteSettings } from '@/lib/settings-repository';
import './styles/base.css';
import './styles/public.css';
import './styles/home.css';
import './styles/content.css';
import './styles/leetcode.css';
import './styles/share.css';
import './styles/admin.css';
import './styles/responsive.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSiteSettings();

  return buildSiteMetadata(settings, normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL));
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
