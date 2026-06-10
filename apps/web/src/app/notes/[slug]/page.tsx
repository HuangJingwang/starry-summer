import { notFound } from 'next/navigation';

import { ContentDetail } from '@/components/ContentDetail';
import { SiteShell } from '@/components/SiteShell';
import { getAdjacentContent, getContentBySlug } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';
import { buildContentMetadata, normalizePublicSiteUrl } from '@/lib/seo';
import { loadPublicSettings } from '@/lib/settings';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const item = getContentBySlug(content, 'note', slug);

  if (!item) {
    return {};
  }

  const settings = await loadPublicSettings(undefined, {
    apiBaseUrl: process.env.API_BASE_URL,
  });

  return buildContentMetadata(item, settings, normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL));
}

export default async function NoteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const item = getContentBySlug(content, 'note', slug);

  if (!item) {
    notFound();
  }

  return (
    <SiteShell>
      <main className="page-main narrow">
        <ContentDetail item={item} adjacent={getAdjacentContent(content, item.id)} />
      </main>
    </SiteShell>
  );
}
