import Link from 'next/link';

import { AdminContentManager } from '@/components/AdminContentManager';
import { AdminShell } from '@/components/AdminShell';
import { normalizeAdminContentSearchParams } from '@/lib/admin-content';
import { seedContent } from '@/lib/content';

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const { q = '', status, type } = await searchParams;
  const filters = normalizeAdminContentSearchParams({ q, status, type });

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">Content</p>
            <h1>内容管理</h1>
          </div>
          <Link href="/admin/content/new">New content</Link>
        </div>
        <form className="admin-filter" action="/admin/content">
          <input name="q" defaultValue={q} placeholder="搜索标题、摘要、标签" />
          <select name="type" defaultValue={filters.type ?? ''} aria-label="Content type">
            <option value="">All types</option>
            <option value="post">Post</option>
            <option value="note">Note</option>
            <option value="moment">Moment</option>
            <option value="project">Project</option>
            <option value="page">Page</option>
          </select>
          <select name="status" defaultValue={filters.status ?? ''} aria-label="Content status">
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button type="submit">Filter</button>
        </form>
        <AdminContentManager
          fallbackItems={seedContent}
          query={filters.query}
          status={filters.status}
          type={filters.type}
        />
      </section>
    </AdminShell>
  );
}
