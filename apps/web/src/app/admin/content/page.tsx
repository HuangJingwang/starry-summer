import Link from 'next/link';

import { AdminContentManager } from '@/components/AdminContentManager';
import { AdminShell } from '@/components/AdminShell';
import { normalizeAdminContentSearchParams } from '@/lib/admin-content';
import { seedContent } from '@/lib/content';

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; category?: string; tag?: string; series?: string }>;
}) {
  const { q = '', status, type, category, tag, series } = await searchParams;
  const filters = normalizeAdminContentSearchParams({ q, status, type, category, tag, series });

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">内容</p>
            <h1>内容管理</h1>
          </div>
          <Link href="/admin/content/new">新建内容</Link>
        </div>
        <form className="admin-filter" action="/admin/content">
          <input name="q" defaultValue={q} placeholder="搜索标题、摘要、标签" />
          <select name="type" defaultValue={filters.type ?? ''} aria-label="内容类型">
            <option value="">全部类型</option>
            <option value="post">文章</option>
            <option value="note">笔记</option>
            <option value="moment">日常</option>
            <option value="project">项目</option>
            <option value="page">页面</option>
          </select>
          <select name="status" defaultValue={filters.status ?? ''} aria-label="内容状态">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="private">私密</option>
            <option value="archived">已归档</option>
          </select>
          <input name="category" defaultValue={filters.category ?? ''} placeholder="分类" />
          <input name="tag" defaultValue={filters.tag ?? ''} placeholder="标签" />
          <input name="series" defaultValue={filters.series ?? ''} placeholder="系列" />
          <button type="submit">筛选</button>
        </form>
        <AdminContentManager
          fallbackItems={seedContent}
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
