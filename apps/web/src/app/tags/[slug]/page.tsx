import { notFound } from 'next/navigation';

import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { getContentByTagSlug, groupContentByTag } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export async function generateStaticParams() {
  const content = await loadSiteContent();

  return groupContentByTag(content).map((group) => ({
    slug: group.key,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const group = getContentByTagSlug(content, slug);

  if (!group) {
    return {};
  }

  return {
    title: `${group.label} | Starry Summer`,
    description: `Tag archive for ${group.label}.`,
  };
}

export default async function TagDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const group = getContentByTagSlug(content, slug);

  if (!group) {
    notFound();
  }

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Tag</p>
          <h1>{group.label}</h1>
          <p>{group.items.length} 篇内容带有这个标签。</p>
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
