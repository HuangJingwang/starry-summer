import Link from 'next/link';

import { filterAdminContent } from '@/lib/admin-content';
import type { SiteContentItem } from '@/lib/content';

export function AdminContentTable({
  items,
  query = '',
  status,
  type,
  category,
  tag,
  series,
}: {
  items: SiteContentItem[];
  query?: string;
  status?: SiteContentItem['status'];
  type?: SiteContentItem['type'];
  category?: string;
  tag?: string;
  series?: string;
}) {
  const filtered = filterAdminContent(items, { query, status, type, category, tag, series });

  return (
    <div className="admin-table" role="table" aria-label="Content list">
      <div className="admin-table__row admin-table__head" role="row">
        <span>Title</span>
        <span>Type</span>
        <span>Status</span>
        <span>Updated</span>
        <span>Action</span>
      </div>
      {filtered.map((item) => (
        <div key={item.id} className="admin-table__row" role="row">
          <span>{item.title}</span>
          <span>{item.type}</span>
          <span>{item.visibility === 'private' ? 'private' : item.status}</span>
          <span>{item.publishedAt}</span>
          <Link href={`/admin/content/${item.id}`}>Edit</Link>
        </div>
      ))}
      {filtered.length === 0 ? <p className="admin-table__empty">没有匹配的内容。</p> : null}
    </div>
  );
}
