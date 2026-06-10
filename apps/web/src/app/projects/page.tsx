import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { getPublicContent, seedContent } from '@/lib/content';

export default function ProjectsPage() {
  const projects = getPublicContent(seedContent, 'project');

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
