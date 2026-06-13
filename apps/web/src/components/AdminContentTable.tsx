'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import {
  buildAdminContentBulkActionRequests,
  buildAdminContentSelectionState,
  filterAdminContent,
  formatAdminContentType,
  formatAdminContentVisibilityStatus,
  getAdminContentUpdatedLabel,
  readAdminContentErrorMessage,
  type AdminContentBulkAction,
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
  query?: string;
  status?: SiteContentItem['status'];
  type?: SiteContentItem['type'];
  category?: string;
  tag?: string;
  series?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkState, setBulkState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [bulkMessage, setBulkMessage] = useState('');
  const selectAllRef = useRef<HTMLInputElement>(null);
  const filtered = filterAdminContent(items, { query, status, type, category, tag, series });
  const selectionState = buildAdminContentSelectionState(filtered, selectedIds);
  const selectedSet = new Set(selectionState.selectedIds);
  const selectedCount = selectionState.selectedCount;
  const allSelected = selectionState.allSelected;
  const partiallySelected = selectionState.partiallySelected;
  const bulkActionDisabled = bulkState === 'submitting' || selectedCount === 0;

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

  async function runBulkAction(action: AdminContentBulkAction) {
    if (selectedCount === 0) {
      setBulkState('error');
      setBulkMessage('请先选择要处理的内容。');
      return;
    }

    setBulkState('submitting');
    setBulkMessage('');

    try {
      const requests = buildAdminContentBulkActionRequests(selectionState.selectedIds, action);

      for (const request of requests) {
        const response = await fetch(request.url, request.init);

        if (!response.ok) {
          throw new Error(await readAdminContentErrorMessage(response, `请求失败，服务器返回 ${response.status}。`));
        }
      }

      setBulkState('success');
      setBulkMessage(`已处理 ${requests.length} 条内容，正在刷新列表。`);
      setSelectedIds([]);
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      setBulkState('error');
      setBulkMessage(error instanceof Error ? error.message : '批量操作失败，请确认已登录且 API 服务可用。');
    }
  }

  return (
    <div className="admin-table-shell">
      <div className="admin-table-bulkbar" aria-label="批量操作">
        <div>
          <strong role="status" aria-live="polite">当前列表已选择 {selectedCount} 条</strong>
          <span>批量处理发布状态和公开范围</span>
        </div>
        <div className="admin-table-bulkbar__actions">
          <button type="button" onClick={() => runBulkAction('publish')} disabled={bulkActionDisabled}>
            发布
          </button>
          <button type="button" onClick={() => runBulkAction('archive')} disabled={bulkActionDisabled}>
            归档
          </button>
          <button type="button" onClick={() => runBulkAction('restore-draft')} disabled={bulkActionDisabled}>
            恢复草稿
          </button>
          <button type="button" onClick={() => runBulkAction('private')} disabled={bulkActionDisabled}>
            设为私密
          </button>
          <button type="button" onClick={() => runBulkAction('public')} disabled={bulkActionDisabled}>
            设为公开
          </button>
        </div>
      </div>
      {bulkMessage ? <p className={`form-message form-message--${bulkState}`} role="status" aria-live="polite">{bulkMessage}</p> : null}
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
