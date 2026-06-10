import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { getPublicContent, seedContent } from '@/lib/content';

export default function MomentsPage() {
  const moments = getPublicContent(seedContent, 'moment');

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Moments</p>
          <h1>日常</h1>
        </div>
        <div className="content-grid">
          {moments.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
