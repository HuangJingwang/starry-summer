import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import { formatPublicContentType, getContentHref, groupContentByMonth } from '@/lib/content';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '归档',
    description: '按发布时间整理所有公开内容，方便从时间线回看文章、日常和项目。',
    path: '/archives',
  });
}

export default async function ArchivesPage() {
  const content = await loadSiteContent();
  const groups = groupContentByMonth(content);
  const total = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <SiteShell>
      <main className="page-main narrow">
        <div className="page-title">
          <p className="eyebrow">归档</p>
          <h1>归档</h1>
          <p>按发布时间整理所有公开内容，方便从时间线回看文章、日常和项目。</p>
        </div>
        <section className="archive-timeline" aria-label="内容归档">
          {groups.map((group) => (
            <div key={group.key} className="archive-month">
              <div className="archive-month__heading">
                <h2>{group.label}</h2>
                <span>{group.items.length} 篇内容</span>
              </div>
              <div className="archive-list">
                {group.items.map((item) => (
                  <Link key={item.id} href={getContentHref(item)} className="archive-item">
                    <time dateTime={item.publishedAt}>{item.publishedAt.slice(5)}</time>
                    <strong>{item.title}</strong>
                    <span>{formatPublicContentType(item.type)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
        <p className="archive-total">共 {total} 篇内容</p>
      </main>
    </SiteShell>
  );
}
