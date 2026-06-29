'use client';

import Link from 'next/link';

import {
  filterAdminContent,
  formatAdminContentType,
  formatAdminContentVisibilityStatus,
  getAdminContentUpdatedLabel,
} from '@/lib/admin-content';
import type { SiteContentItem } from '@/lib/content';

const publicTypePaths: Partial<Record<SiteContentItem['type'], string>> = {
  post: 'posts',
  note: 'notes',
  moment: 'moments',
  project: 'projects',
};

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
  repositoryMode?: boolean;
  query?: string;
  status?: SiteContentItem['status'];
  type?: SiteContentItem['type'];
  category?: string;
  tag?: string;
  series?: string;
}) {
  const filtered = filterAdminContent(items, { query, status, type, category, tag, series });

  async function copyPublicLink(path: string) {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
  }

  return (
    <div className="admin-table-shell">
      <p className="form-message form-message--idle admin-repository-note" role="status" aria-live="polite">
        当前内容列表由仓库文件驱动，不再发送批量数据库请求。
      </p>
      <div className="admin-table" role="table" aria-label="内容列表">
        <div className="admin-table__row admin-table__head" role="row">
          <span>标题</span>
          <span>类型</span>
          <span>状态</span>
          <span>更新</span>
          <span>操作</span>
        </div>
        {filtered.map((item) => {
          const publicPath = getPublicContentPath(item);

          return (
            <div key={item.id} className="admin-table__row" role="row">
              <span className="admin-table__title">
                <strong>{item.title}</strong>
                {item.summary ? <small>{item.summary}</small> : null}
              </span>
              <span>{formatAdminContentType(item.type)}</span>
              <span className={`admin-status-badge admin-status-badge--${item.visibility === 'private' ? 'private' : item.status}`}>
                {formatAdminContentVisibilityStatus(item)}
              </span>
              <span>{getAdminContentUpdatedLabel(item)}</span>
              <span className="admin-table-actions">
                <Link href={`/admin/content/${item.id}`}>编辑</Link>
                {publicPath ? <Link href={publicPath}>预览</Link> : null}
                {publicPath ? (
                  <button type="button" onClick={() => copyPublicLink(publicPath)}>
                    复制链接
                  </button>
                ) : null}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 ? <p className="admin-table__empty">没有匹配的内容。</p> : null}
      </div>
    </div>
  );
}

function getPublicContentPath(item: SiteContentItem): string | null {
  const basePath = publicTypePaths[item.type];

  if (!basePath || !item.slug) {
    return null;
  }

  return `/${basePath}/${item.slug}`;
}
