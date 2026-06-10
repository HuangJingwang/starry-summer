import Link from 'next/link';

import { AdminContentManager } from '@/components/AdminContentManager';
import { AdminShell } from '@/components/AdminShell';
import { normalizeAdminContentSearchParams } from '@/lib/admin-content';
import { seedContent } from '@/lib/content';

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; tag?: string; series?: string }>;
}) {
  const { q = '', status, category, tag, series } = await searchParams;
  const filters = normalizeAdminContentSearchParams({
    q,
    status,
    type: 'project',
    category,
    tag,
    series,
  });

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">Projects</p>
            <h1>项目管理</h1>
          </div>
          <Link href="/admin/content/new?type=project">New project</Link>
        </div>
        <form className="admin-filter" action="/admin/projects">
          <input name="q" defaultValue={q} placeholder="搜索项目标题、摘要、技术栈" />
          <select name="status" defaultValue={filters.status ?? ''} aria-label="Project content status">
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="private">Private</option>
            <option value="archived">Archived</option>
          </select>
          <input name="category" defaultValue={filters.category ?? ''} placeholder="分类" />
          <input name="tag" defaultValue={filters.tag ?? ''} placeholder="标签" />
          <input name="series" defaultValue={filters.series ?? ''} placeholder="系列" />
          <button type="submit">Filter</button>
        </form>
        <AdminContentManager
          fallbackItems={seedContent}
          query={filters.query}
          status={filters.status}
          type="project"
          category={filters.category}
          tag={filters.tag}
          series={filters.series}
          basePath="/admin/projects"
        />
      </section>
    </AdminShell>
  );
}
