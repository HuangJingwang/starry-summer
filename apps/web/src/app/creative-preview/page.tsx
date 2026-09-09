import type { Metadata } from 'next';

import { loadSiteContent } from '@/lib/public-content';
import { loadSiteSettings } from '@/lib/settings-repository';

import { BlogHomePreview } from './CreativePortfolioPreview';
import { selectPreviewContent } from './preview-content';

export const metadata: Metadata = {
  title: 'Starry Summer · Aster.H 的个人博客',
  description: '文章、笔记、片刻与项目。Aster.H 的个人内容平台。',
  robots: { index: false, follow: false },
};

export default async function CreativePreviewPage() {
  const [content, settings] = await Promise.all([loadSiteContent(), loadSiteSettings()]);

  return <BlogHomePreview {...selectPreviewContent(content)} description={settings.profile.description} />;
}
