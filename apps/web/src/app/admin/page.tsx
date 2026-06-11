import Link from 'next/link';
import { cookies } from 'next/headers';

import { AdminShell } from '@/components/AdminShell';
import { getAdminContentStats, loadAdminContentItems } from '@/lib/admin-content';
import { seedContent } from '@/lib/content';
import { loadAdminModerationCount } from '@/lib/interaction-client';

export default async function AdminPage() {
  const cookieHeader = (await cookies()).toString();
  const adminRequestOptions = {
    apiBaseUrl: process.env.API_BASE_URL,
    cookieHeader,
  };
  const { items } = await loadAdminContentItems(seedContent, undefined, {
    ...adminRequestOptions,
  });
  const [pendingComments, pendingGuestbook] = await Promise.all([
    loadAdminModerationCount('comments', 'pending', adminRequestOptions),
    loadAdminModerationCount('guestbook', 'pending', adminRequestOptions),
  ]);
  const stats = getAdminContentStats(items);

  return (
    <AdminShell>
      <section className="admin-panel">
        <div>
          <p className="eyebrow">后台</p>
          <h1>创作后台</h1>
          <p>管理文章、笔记、日常、项目、评论、留言和站点配置。</p>
        </div>
        <div className="admin-grid">
          <span>全部内容 {stats.total}</span>
          <span>已发布 {stats.published}</span>
          <span>私密内容 {stats.private}</span>
          <span>已归档 {stats.archived}</span>
          <span>待审评论 {pendingComments}</span>
          <span>待审留言 {pendingGuestbook}</span>
        </div>
        <div className="admin-actions">
          <Link href="/admin/content/new">新建内容</Link>
          <Link href="/admin/content">管理内容</Link>
        </div>
      </section>
    </AdminShell>
  );
}
