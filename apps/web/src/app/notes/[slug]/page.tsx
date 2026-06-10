import { notFound } from 'next/navigation';

import { ContentDetail } from '@/components/ContentDetail';
import { SiteShell } from '@/components/SiteShell';
import { getAdjacentContent, getContentBySlug, seedContent } from '@/lib/content';

export default async function NoteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getContentBySlug(seedContent, 'note', slug);

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
