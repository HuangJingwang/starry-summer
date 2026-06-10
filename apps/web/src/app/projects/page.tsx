import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { loadSiteContent } from '@/lib/public-content';

export default async function ProjectsPage() {
  const projects = await loadSiteContent('project');

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Projects</p>
          <h1>项目</h1>
        </div>
        <div className="content-grid">
          {projects.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
