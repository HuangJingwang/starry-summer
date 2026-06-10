'use client';

import { useEffect, useState } from 'react';

import { loadAdminContentItems, type AdminContentLoadResult } from '@/lib/admin-content';
import type { SiteContentItem } from '@/lib/content';

import { AdminContentTable } from './AdminContentTable';

interface AdminContentManagerProps {
  fallbackItems: SiteContentItem[];
  query?: string;
  status?: SiteContentItem['status'];
  type?: SiteContentItem['type'];
  category?: string;
  tag?: string;
}

export function AdminContentManager({
  fallbackItems,
  query = '',
  status,
  type,
  category,
  tag,
}: AdminContentManagerProps) {
  const [result, setResult] = useState<AdminContentLoadResult>({
    source: 'fallback',
    items: fallbackItems,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const nextResult = await loadAdminContentItems(fallbackItems, undefined, {
        filters: {
          q: query,
          status,
          type,
          category,
          tag,
        },
      });

      if (active) {
        setResult(nextResult);
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [fallbackItems, query, status, type, category, tag]);

  return (
    <div className="admin-content-manager">
      <p className="admin-data-note">
        {loading
          ? '正在读取后台内容...'
          : result.source === 'api'
            ? `已加载 ${result.items.length} 条后台内容。`
            : '当前显示本地样例内容。'}
      </p>
      <AdminContentTable items={result.items} query={query} status={status} type={type} category={category} tag={tag} />
    </div>
  );
}
