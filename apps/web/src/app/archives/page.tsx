import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import { getContentHref, groupContentByMonth, seedContent } from '@/lib/content';

export default function ArchivesPage() {
  const groups = groupContentByMonth(seedContent);
  const total = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <SiteShell>
      <main className="page-main narrow">
        <div className="page-title">
          <p className="eyebrow">Archives</p>
          <h1>归档</h1>
          <p>按发布时间整理所有公开内容，方便从时间线回看文章、笔记、日常和项目。</p>
        </div>
        <section className="archive-timeline" aria-label="Content archive">
          {groups.map((group) => (
            <div key={group.key} className="archive-month">
              <div className="archive-month__heading">
                <h2>{group.label}</h2>
                <span>{group.items.length} items</span>
              </div>
              <div className="archive-list">
                {group.items.map((item) => (
                  <Link key={item.id} href={getContentHref(item)} className="archive-item">
                    <time dateTime={item.publishedAt}>{item.publishedAt.slice(5)}</time>
                    <strong>{item.title}</strong>
                    <span>{item.type}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
        <p className="archive-total">{total} items in total</p>
      </main>
    </SiteShell>
  );
}
