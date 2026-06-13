import { notFound } from 'next/navigation';

import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { getContentBySeriesSlug } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const group = getContentBySeriesSlug(content, slug);

  if (!group) {
    return {};
  }

  return {
    title: `${group.label} | Starry Summer`,
    description: `${group.label} 系列归档。`,
  };
}

export default async function SeriesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const group = getContentBySeriesSlug(content, slug);

  if (!group) {
    notFound();
  }

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">系列</p>
          <h1>{group.label}</h1>
          <p>{group.items.length} 篇内容沿着这个系列持续沉淀。</p>
        </div>
        <div className="content-grid">
          {group.items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
