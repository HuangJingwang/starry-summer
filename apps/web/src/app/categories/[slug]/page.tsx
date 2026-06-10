import { notFound } from 'next/navigation';

import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { getContentByCategorySlug } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const group = getContentByCategorySlug(content, slug);

  if (!group) {
    return {};
  }

  return {
    title: `${group.label} | Starry Summer`,
    description: `Category archive for ${group.label}.`,
  };
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const group = getContentByCategorySlug(content, slug);

  if (!group) {
    notFound();
  }

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Category</p>
          <h1>{group.label}</h1>
          <p>{group.items.length} 篇内容归在这个分类下。</p>
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
