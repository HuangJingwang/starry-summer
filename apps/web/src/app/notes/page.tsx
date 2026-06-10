import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { loadSiteContent } from '@/lib/public-content';

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
