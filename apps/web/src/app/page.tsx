import Image from 'next/image';

import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { getFeaturedContent, groupContentCounts } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export default async function HomePage() {
  const content = await loadSiteContent();
  const featured = getFeaturedContent(content).slice(0, 3);
  const counts = groupContentCounts(content);

  return (
    <SiteShell>
      <main>
        <section className="hero">
          <Image
            className="hero__image"
            src="/hero-workspace.png"
            alt="A calm desk workspace with notebook and laptop for writing"
            fill
            priority
            sizes="100vw"
          />
          <div className="hero__overlay" />
          <div className="hero__content">
            <p className="eyebrow">Personal content platform</p>
            <h1>Starry Summer</h1>
            <p>
              记录文章、笔记、日常和项目，把零散想法整理成一个可以长期部署、迁移和扩展的个人内容系统。
            </p>
            <div className="hero__actions" aria-label="Primary actions">
              <a href="/posts">Read writing</a>
              <a href="/projects">View projects</a>
            </div>
          </div>
        </section>

        <section className="stats-band" aria-label="Site statistics">
          <div>
            <strong>{counts.post}</strong>
            <span>Articles</span>
          </div>
          <div>
            <strong>{counts.note}</strong>
            <span>Notes</span>
          </div>
          <div>
            <strong>{counts.moment}</strong>
            <span>Moments</span>
          </div>
          <div>
            <strong>{counts.project}</strong>
            <span>Projects</span>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">Featured</p>
            <h2>最近沉淀</h2>
          </div>
          <div className="content-grid">
            {featured.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
