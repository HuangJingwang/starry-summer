import { notFound } from 'next/navigation';

import { ContentDetail } from '@/components/ContentDetail';
import { SiteShell } from '@/components/SiteShell';
import { getAdjacentContent, getContentBySlug, seedContent } from '@/lib/content';

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getContentBySlug(seedContent, 'post', slug);

  if (!item) {
    notFound();
  }

  return (
    <SiteShell>
      <main className="page-main narrow">
        <ContentDetail item={item} adjacent={getAdjacentContent(seedContent, item.id)} />
      </main>
    </SiteShell>
  );
}
