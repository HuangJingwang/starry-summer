import Link from 'next/link';

import { AdminContentManager } from '@/components/AdminContentManager';
import { AdminShell } from '@/components/AdminShell';
import { normalizeAdminContentSearchParams } from '@/lib/admin-content';
import { loadRepositoryAdminContentItems } from '@/lib/admin-content-repository';
import { seedContent } from '@/lib/content';

const contentTypeFilters = [
  { label: '全部', value: '' },
  { label: '文章', value: 'post' },
  { label: '笔记', value: 'note' },
  { label: '日常', value: 'moment' },
  { label: '项目', value: 'project' },
  { label: '页面', value: 'page' },
];
const contentStatusFilters = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '私密', value: 'private' },
  { label: '已归档', value: 'archived' },
];

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; category?: string; tag?: string; series?: string }>;
}) {
  const { q = '', status, type, category, tag, series } = await searchParams;
  const filters = normalizeAdminContentSearchParams({ q, status, type, category, tag, series });
  const initialResult = await loadRepositoryAdminContentItems({ filters });

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">内容</p>
            <h1>内容管理</h1>
            <p>按类型、状态、分类、标签和系列快速定位内容，集中处理发布、归档与编辑。</p>
          </div>
          <Link href="/admin/content/new">新建内容</Link>
        </div>
        <div className="admin-filter-bar" aria-label="内容筛选">
          <form className="admin-filter-search" action="/admin/content">
            <input name="q" defaultValue={q} placeholder="搜索标题、摘要、标签" aria-label="搜索内容" />
            {filters.type ? <input type="hidden" name="type" value={filters.type} /> : null}
            {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
            {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
            {filters.tag ? <input type="hidden" name="tag" value={filters.tag} /> : null}
            {filters.series ? <input type="hidden" name="series" value={filters.series} /> : null}
            <button type="submit">搜索</button>
          </form>
          <nav className="admin-type-segments" aria-label="内容类型">
            {contentTypeFilters.map((option) => (
              <Link
                key={option.label}
                data-active={(filters.type ?? '') === option.value ? 'true' : undefined}
                href={buildContentFilterHref({ q, type: option.value, status: filters.status, category: filters.category, tag: filters.tag, series: filters.series })}
              >
                {option.label}
              </Link>
            ))}
          </nav>
          <nav className="admin-status-chips" aria-label="内容状态">
            {contentStatusFilters.map((option) => (
              <Link
                key={option.label}
                data-active={(filters.status ?? '') === option.value ? 'true' : undefined}
                href={buildContentFilterHref({ q, type: filters.type, status: option.value, category: filters.category, tag: filters.tag, series: filters.series })}
              >
                {option.label}
              </Link>
            ))}
          </nav>
          <details className="admin-filter-more">
            <summary>更多筛选</summary>
            <form className="admin-filter-more__form" action="/admin/content">
              {q ? <input type="hidden" name="q" value={q} /> : null}
              {filters.type ? <input type="hidden" name="type" value={filters.type} /> : null}
              {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
              <label>
                分类
                <input name="category" defaultValue={filters.category ?? ''} placeholder="分类" />
              </label>
              <label>
                标签
                <input name="tag" defaultValue={filters.tag ?? ''} placeholder="标签" />
              </label>
              <label>
                系列
                <input name="series" defaultValue={filters.series ?? ''} placeholder="系列" />
              </label>
              <button type="submit">应用筛选</button>
            </form>
          </details>
        </div>
        <AdminContentManager
          fallbackItems={seedContent}
          initialResult={initialResult}
          repositoryMode
          query={filters.query}
          status={filters.status}
          type={filters.type}
          category={filters.category}
          tag={filters.tag}
          series={filters.series}
        />
      </section>
    </AdminShell>
  );
}

function buildContentFilterHref({
  q,
  type,
  status,
  category,
  tag,
  series,
}: {
  q?: string;
  type?: string;
  status?: string;
  category?: string;
  tag?: string;
  series?: string;
}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ q, type, status, category, tag, series })) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `/admin/content?${query}` : '/admin/content';
}
