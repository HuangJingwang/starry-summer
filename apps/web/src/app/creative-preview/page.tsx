import type { Metadata } from 'next';

import { getContentCover } from '@/lib/content-cover';
import { getContentHref } from '@/lib/content-routing';
import { getPublicContent, getSiteStats } from '@/lib/content-public';
import type { SiteContentItem } from '@/lib/content-types';
import { loadSiteContent } from '@/lib/public-content';
import { loadSiteSettings } from '@/lib/settings-repository';

import { BlogHomePreview, type BlogPreviewEntry } from './CreativePortfolioPreview';

export const metadata: Metadata = {
  title: 'Blog Home Preview · Aster.H',
  description: 'A content-first home page preview for the Starry Summer archive.',
  robots: { index: false, follow: false },
};

export default async function CreativePreviewPage() {
  const [content, settings] = await Promise.all([loadSiteContent(), loadSiteSettings()]);
  const publicContent = getPublicContent(content).sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  const articles = publicContent.filter((item) => item.type === 'post' || item.type === 'note');
  const featured = toPreviewEntry(articles.find((item) => !item.pinned) ?? articles[0] ?? publicContent[0]);
  const recentEntries = publicContent
    .filter((item) => item.id !== featured?.id)
    .slice(0, 5)
    .map(toPreviewEntry)
    .filter((item): item is BlogPreviewEntry => Boolean(item));
  const stats = getSiteStats(publicContent);

  return (
    <BlogHomePreview
      description={settings.profile.description}
      featured={featured}
      lastPublishedAt={publicContent[0]?.publishedAt ?? ''}
      motto={settings.hero.motto}
      publicCount={stats.publicCount}
      recentEntries={recentEntries}
    />
  );
}

function toPreviewEntry(item: SiteContentItem | undefined): BlogPreviewEntry | undefined {
  if (!item) {
    return undefined;
  }

  const cover = getContentCover(item);

  return {
    cover: cover ? { alt: cover.altText, src: cover.imageUrl } : undefined,
    excerpt: item.summary?.trim() || '一则正在整理中的公开记录。',
    href: getContentHref(item),
    id: item.id,
    publishedAt: item.publishedAt,
    title: item.title,
    type: item.type,
  };
}
