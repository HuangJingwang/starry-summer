import type { Metadata } from 'next';

import { loadPublicSettings } from '@/lib/settings';
import './styles.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadPublicSettings(undefined, {
    apiBaseUrl: process.env.API_BASE_URL,
  });

  return {
    title: settings.profile.title,
    description: settings.profile.description,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
