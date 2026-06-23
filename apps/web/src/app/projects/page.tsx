import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '项目',
    description: '开源项目、产品实验和作品集记录。',
    path: '/projects',
  });
}

export default async function ProjectsPage() {
  const projects = await loadSiteContent('project');

  return (
    <SiteShell>
      <main className="page-main projects-page">
        <div className="page-title">
          <p className="eyebrow">项目</p>
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
