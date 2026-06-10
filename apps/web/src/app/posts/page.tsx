import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { loadSiteContent } from '@/lib/public-content';

export default async function PostsPage() {
  const posts = await loadSiteContent('post');

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Writing</p>
          <h1>文章</h1>
        </div>
        <div className="content-grid">
          {posts.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
