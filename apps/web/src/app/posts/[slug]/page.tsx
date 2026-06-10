import { notFound } from 'next/navigation';

import { ContentDetail } from '@/components/ContentDetail';
import { SiteShell } from '@/components/SiteShell';
import { getAdjacentContent, getContentBySlug } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const item = getContentBySlug(content, 'post', slug);

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
