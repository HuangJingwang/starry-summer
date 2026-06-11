'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { buildAdminContentDashboard, loadAdminContentItems, type AdminContentLoadResult } from '@/lib/admin-content';
import type { SiteContentItem } from '@/lib/content';

import { AdminContentTable } from './AdminContentTable';

interface AdminContentManagerProps {
  fallbackItems: SiteContentItem[];
  query?: string;
  status?: SiteContentItem['status'];
  type?: SiteContentItem['type'];
  category?: string;
  tag?: string;
  series?: string;
  basePath?: string;
}

export function AdminContentManager({
  fallbackItems,
  query = '',
  status,
  type,
  category,
  tag,
  series,
  basePath = '/admin/content',
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
          series,
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
  }, [fallbackItems, query, status, type, category, tag, series]);

  const dashboard = buildAdminContentDashboard(result.items, { query, status, type, category, tag, series }, { basePath });

  return (
    <div className="admin-content-manager">
      <p className="admin-data-note">
        {loading
          ? '正在读取后台内容...'
          : result.source === 'api'
            ? `已加载 ${result.items.length} 条后台内容。`
            : '当前显示本地样例内容。'}
      </p>
      <div className="admin-status-grid" aria-label="内容状态概览">
        {dashboard.statusCards.map((card) => (
          <Link key={card.label} className={card.active ? 'active' : ''} href={card.href}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </Link>
        ))}
      </div>
      <div className="admin-content-summary">
        <div>
          <strong>{dashboard.filteredTotal}</strong>
          <span>{dashboard.activeFilters.length > 0 ? dashboard.activeFilters.join(' / ') : '全部内容'}</span>
        </div>
        <div>
          <strong>最近更新</strong>
          {dashboard.recentItems.length > 0 ? (
            <ol>
              {dashboard.recentItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href}>{item.title}</Link>
                  <span>{item.meta}</span>
                </li>
              ))}
            </ol>
          ) : (
            <span>暂无匹配内容</span>
          )}
        </div>
      </div>
      <AdminContentTable items={result.items} query={query} status={status} type={type} category={category} tag={tag} series={series} />
    </div>
  );
}
