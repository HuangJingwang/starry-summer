import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { groupContentByTag } from '@/lib/content';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '标签',
    description: '用关键词串起文章、日常和项目，快速回到相同主题的内容。',
    path: '/tags',
  });
}

export default async function TagsPage() {
  const content = await loadSiteContent();
  const groups = groupContentByTag(content);
  const total = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">THE INDEX / KEYWORDS</p>
          <h1>标签</h1>
          <p>用更细的关键词串起文章、日常和项目，快速回到相同技术、主题或状态的内容。</p>
        </div>
        <nav className="journal-taxonomy-index" aria-label="标签索引">{groups.map((group) => <a key={group.key} href={`#tag-${group.key}`}>{group.label}<span>{group.items.length}</span></a>)}</nav>
        <div className="category-stack">
          {groups.map((group) => (
            <section key={group.key} className="category-section" aria-labelledby={`tag-${group.key}`}>
              <div className="category-section__heading">
                <h2 id={`tag-${group.key}`}>{group.label}</h2>
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
        <p className="archive-total">共 {total} 条标签关联</p>
      </main>
    </SiteShell>
  );
}
