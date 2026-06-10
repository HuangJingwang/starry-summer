import Link from 'next/link';
import { cookies } from 'next/headers';

import { AdminShell } from '@/components/AdminShell';
import { getAdminContentStats, loadAdminContentItems } from '@/lib/admin-content';
import { seedContent } from '@/lib/content';

export default async function AdminPage() {
  const cookieHeader = (await cookies()).toString();
  const { items } = await loadAdminContentItems(seedContent, undefined, {
    apiBaseUrl: process.env.API_BASE_URL,
    cookieHeader,
  });
  const stats = getAdminContentStats(items);

  return (
    <AdminShell>
      <section className="admin-panel">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>创作后台</h1>
          <p>管理文章、笔记、日常、项目、评论、留言和站点配置。</p>
        </div>
        <div className="admin-grid">
          <span>Total {stats.total}</span>
          <span>Published {stats.published}</span>
          <span>Private {stats.private}</span>
          <span>Archived {stats.archived}</span>
          <span>Pending comments 0</span>
          <span>Guestbook review 0</span>
        </div>
        <div className="admin-actions">
          <Link href="/admin/content/new">新建内容</Link>
          <Link href="/admin/content">管理内容</Link>
        </div>
      </section>
    </AdminShell>
  );
}
