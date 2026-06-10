import Image from 'next/image';
import Link from 'next/link';

import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { getFeaturedContent, getPopularContent, getSiteStats } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export default async function HomePage() {
  const content = await loadSiteContent();
  const featured = getFeaturedContent(content).slice(0, 3);
  const popular = getPopularContent(content, {
    excludeIds: featured.map((item) => item.id),
    limit: 3,
  });
  const stats = getSiteStats(content);

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
            <strong>{formatNumber(stats.publicCount)}</strong>
            <span>Published</span>
          </div>
          <div>
            <strong>{formatNumber(stats.totalViews)}</strong>
            <span>Views</span>
          </div>
          <div>
            <strong>{formatNumber(stats.totalLikes)}</strong>
            <span>Likes</span>
          </div>
          <div>
            <strong>{stats.lastPublishedAt || 'Soon'}</strong>
            <span>Updated</span>
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

        {popular.length > 0 ? (
          <section className="content-section content-section--subtle">
            <div className="section-heading section-heading--row">
              <div>
                <p className="eyebrow">Popular</p>
                <h2>热门内容</h2>
              </div>
              <Link href="/posts?sort=popular">查看热门文章</Link>
            </div>
            <div className="content-grid">
              {popular.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </SiteShell>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
