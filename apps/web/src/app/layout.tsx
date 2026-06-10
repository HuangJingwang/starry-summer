import type { Metadata } from 'next';

import './styles.css';

export const metadata: Metadata = {
  title: 'Starry Summer',
  description: 'A personal content platform for writing, notes, moments, projects, and reader interaction.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
