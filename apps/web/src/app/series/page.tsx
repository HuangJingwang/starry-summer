import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { groupContentBySeries } from '@/lib/content';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '系列',
    description: '连续写作、项目日志和长期主题的完整上下文。',
    path: '/series',
  });
}

export default async function SeriesPage() {
  const content = await loadSiteContent();
  const groups = groupContentBySeries(content);
  const total = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">系列</p>
          <h1>系列</h1>
          <p>把连续写作、项目日志和长期主题串起来，方便按一条线索回看完整上下文。</p>
        </div>
        <div className="category-stack">
          {groups.map((group) => (
            <section key={group.key} className="category-section" aria-labelledby={`series-${group.key}`}>
              <div className="category-section__heading">
                <h2 id={`series-${group.key}`}>{group.label}</h2>
                <span>{group.items.length} 篇内容</span>
              </div>
              <div className="content-grid">
                {group.items.map((item) => (
                  <ContentCard key={`${group.key}-${item.id}`} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="archive-total">共 {total} 条系列关联</p>
      </main>
    </SiteShell>
  );
}
