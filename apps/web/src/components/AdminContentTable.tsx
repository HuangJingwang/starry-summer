import Link from 'next/link';

import { filterAdminContent, getAdminContentUpdatedLabel } from '@/lib/admin-content';
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
    <div className="admin-table" role="table" aria-label="内容列表">
      <div className="admin-table__row admin-table__head" role="row">
        <span>标题</span>
        <span>类型</span>
        <span>状态</span>
        <span>更新</span>
        <span>操作</span>
      </div>
      {filtered.map((item) => (
        <div key={item.id} className="admin-table__row" role="row">
          <span>{item.title}</span>
          <span>{formatContentType(item.type)}</span>
          <span>{item.visibility === 'private' ? '私密' : formatContentStatus(item.status)}</span>
          <span>{getAdminContentUpdatedLabel(item)}</span>
          <Link href={`/admin/content/${item.id}`}>编辑</Link>
        </div>
      ))}
      {filtered.length === 0 ? <p className="admin-table__empty">没有匹配的内容。</p> : null}
    </div>
  );
}

function formatContentType(type: SiteContentItem['type']): string {
  const labels: Record<SiteContentItem['type'], string> = {
    post: '文章',
    note: '笔记',
    moment: '日常',
    project: '项目',
    page: '页面',
  };

  return labels[type] ?? type;
}

function formatContentStatus(status: SiteContentItem['status']): string {
  const labels: Record<SiteContentItem['status'], string> = {
    draft: '草稿',
    published: '已发布',
    private: '私密',
    archived: '已归档',
  };

  return labels[status] ?? status;
}
