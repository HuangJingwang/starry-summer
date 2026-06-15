'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import {
  buildAdminContentSelectionState,
  filterAdminContent,
  formatAdminContentType,
  formatAdminContentVisibilityStatus,
  getAdminContentUpdatedLabel,
} from '@/lib/admin-content';
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
  repositoryMode?: boolean;
  query?: string;
  status?: SiteContentItem['status'];
  type?: SiteContentItem['type'];
  category?: string;
  tag?: string;
  series?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const filtered = filterAdminContent(items, { query, status, type, category, tag, series });
  const selectionState = buildAdminContentSelectionState(filtered, selectedIds);
  const selectedSet = new Set(selectionState.selectedIds);
  const selectedCount = selectionState.selectedCount;
  const allSelected = selectionState.allSelected;
  const partiallySelected = selectionState.partiallySelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  function toggleAll() {
    setSelectedIds(allSelected ? [] : filtered.map((item) => item.id));
  }

  function toggleItem(id: string) {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    ));
  }

  return (
    <div className="admin-table-shell">
      <div className="admin-table-bulkbar" aria-label="批量操作">
        <div>
          <strong role="status" aria-live="polite">当前列表已选择 {selectedCount} 条</strong>
          <span>批量数据库操作已停用，请进入单篇编辑页保存并提交 Git 变更。</span>
        </div>
      </div>
      <p className="form-message form-message--idle" role="status" aria-live="polite">
        当前内容列表由仓库文件驱动，不再发送批量数据库请求。
      </p>
      <div className="admin-table" role="table" aria-label="内容列表">
        <div className="admin-table__row admin-table__head" role="row">
          <span className="admin-table-select">
            <input
              ref={selectAllRef}
              type="checkbox"
              aria-label="选择全部内容"
              aria-checked={partiallySelected ? 'mixed' : allSelected}
              checked={allSelected}
              onChange={toggleAll}
            />
          </span>
          <span>标题</span>
          <span>类型</span>
          <span>状态</span>
          <span>更新</span>
          <span>操作</span>
        </div>
        {filtered.map((item) => (
          <div key={item.id} className="admin-table__row" role="row">
            <span className="admin-table-select">
              <input
                type="checkbox"
                aria-label={`选择 ${item.title}`}
                checked={selectedSet.has(item.id)}
                onChange={() => toggleItem(item.id)}
              />
            </span>
            <span className="admin-table__title">
              <strong>{item.title}</strong>
              {item.summary ? <small>{item.summary}</small> : null}
            </span>
            <span>{formatAdminContentType(item.type)}</span>
            <span className={`admin-status-badge admin-status-badge--${item.visibility === 'private' ? 'private' : item.status}`}>
              {formatAdminContentVisibilityStatus(item)}
            </span>
            <span>{getAdminContentUpdatedLabel(item)}</span>
            <Link href={`/admin/content/${item.id}`}>编辑</Link>
          </div>
        ))}
        {filtered.length === 0 ? <p className="admin-table__empty">没有匹配的内容。</p> : null}
      </div>
    </div>
  );
}
