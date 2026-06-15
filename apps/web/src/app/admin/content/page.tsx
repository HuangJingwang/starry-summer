import Link from 'next/link';

import { AdminContentManager } from '@/components/AdminContentManager';
import { AdminShell } from '@/components/AdminShell';
import { normalizeAdminContentSearchParams } from '@/lib/admin-content';
import { loadRepositoryAdminContentItems } from '@/lib/admin-content-repository';
import { seedContent } from '@/lib/content';

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
        <form className="admin-filter" action="/admin/content" aria-label="内容筛选">
          <label className="admin-filter__search">
            搜索
            <input name="q" defaultValue={q} placeholder="标题、摘要、标签" />
          </label>
          <label>
            类型
            <select name="type" defaultValue={filters.type ?? ''} aria-label="内容类型">
              <option value="">全部类型</option>
              <option value="post">文章</option>
              <option value="moment">日常</option>
              <option value="project">项目</option>
              <option value="page">页面</option>
            </select>
          </label>
          <label>
            状态
            <select name="status" defaultValue={filters.status ?? ''} aria-label="内容状态">
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="private">私密</option>
              <option value="archived">已归档</option>
            </select>
          </label>
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
          <button type="submit">筛选</button>
        </form>
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
