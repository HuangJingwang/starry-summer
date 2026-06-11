import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { groupContentByCategory } from '@/lib/content';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '分类',
    description: '按主题整理公开内容，把文章、笔记、日常和项目放回长期线索里。',
    path: '/categories',
  });
}

export default async function CategoriesPage() {
  const content = await loadSiteContent();
  const groups = groupContentByCategory(content);
  const total = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <SiteShell>
      <main className="page-main">
        <div className="page-title">
          <p className="eyebrow">Categories</p>
          <h1>分类</h1>
          <p>按主题整理公开内容，把文章、笔记、日常和项目放回它们所属的长期线索里。</p>
        </div>
        <div className="category-stack">
          {groups.map((group) => (
            <section key={group.key} className="category-section" aria-labelledby={`category-${group.key}`}>
              <div className="category-section__heading">
                <h2 id={`category-${group.key}`}>{group.label}</h2>
                <span>{group.items.length} items</span>
              </div>
              <div className="content-grid">
                {group.items.map((item) => (
                  <ContentCard key={`${group.key}-${item.id}`} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="archive-total">{total} category links in total</p>
      </main>
    </SiteShell>
  );
}
