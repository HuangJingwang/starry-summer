import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '笔记',
    description: '读书摘录、技术片段和临时灵感。',
    path: '/notes',
  });
}

export default async function NotesPage() {
  const notes = await loadSiteContent('note');

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Notes</p>
          <h1>笔记</h1>
        </div>
        <div className="content-grid">
          {notes.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
