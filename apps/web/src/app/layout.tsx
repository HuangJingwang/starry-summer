import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { buildSiteMetadata, resolvePublicSiteUrl } from '@/lib/seo';
import { loadSiteSettings } from '@/lib/settings-repository';
import { getInitialThemeFromCookie, getThemeInitScript } from '@/lib/site-theme';
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

  return buildSiteMetadata(
    settings,
    resolvePublicSiteUrl({
      configuredUrl: process.env.PUBLIC_SITE_URL,
      productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    }),
  );
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialTheme = getInitialThemeFromCookie(await cookies());

  return (
    <html lang="zh-CN" data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
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
