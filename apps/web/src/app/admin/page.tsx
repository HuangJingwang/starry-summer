import Link from 'next/link';
import { cookies } from 'next/headers';

import { AdminShell } from '@/components/AdminShell';
import { buildAdminOverviewSnapshot, getAdminContentStats, loadAdminContentItems } from '@/lib/admin-content';
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
  const overview = buildAdminOverviewSnapshot(items);
  const statCards = [
    { label: '全部内容', value: stats.total, hint: '文章、日常、项目、页面', href: '/admin/content' },
    { label: '已发布', value: stats.published, hint: '前台可见内容', href: '/admin/content?status=published' },
    { label: '私密内容', value: stats.private, hint: '仅后台留存', href: '/admin/content?status=private' },
    { label: '已归档', value: stats.archived, hint: '可恢复或清理', href: '/admin/content?status=archived' },
    { label: '总浏览', value: overview.totals.views, hint: '公开内容访问累计', href: '/admin/content?status=published' },
    { label: '总喜欢', value: overview.totals.likes, hint: '访客轻反馈累计', href: '/admin/content?status=published' },
  ];
  const moderationCards = [
    { label: '待处理评论', value: pendingComments, href: '/admin/comments' },
    { label: '待处理留言', value: pendingGuestbook, href: '/admin/guestbook' },
  ];

  return (
    <AdminShell>
      <section className="admin-panel admin-panel--hero">
        <div className="admin-hero-copy">
          <p className="eyebrow">后台</p>
          <h1>创作后台</h1>
          <p>管理文章、日常、项目、评论、留言、素材和站点配置。这里是把公开内容打磨成长期档案的工作台。</p>
          <div className="admin-actions">
            <Link href="/admin/content/new">新建内容</Link>
            <Link href="/admin/content">进入内容库</Link>
            <Link href="/admin/assets">整理素材</Link>
          </div>
        </div>
        <div className="admin-signal-panel" aria-label="待处理事项">
          <span>今日关注</span>
          {moderationCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <strong>{card.value}</strong>
              <small>{card.label}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-dashboard-grid" aria-label="内容概览">
        {statCards.map((card) => (
          <Link key={card.label} className="admin-stat-card" href={card.href}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </Link>
        ))}
      </section>

      <section className="admin-panel admin-panel--compact">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">Operations</p>
            <h2>运营快照</h2>
          </div>
          <Link href="/admin/content">查看内容库</Link>
        </div>
        <div className="admin-ops-grid">
          <div className="admin-ops-card">
            <span>草稿待办</span>
            <AdminOverviewList items={overview.draftQueue} emptyText="暂无草稿，可以直接开始新的长文或日常记录。" />
          </div>
          <div className="admin-ops-card">
            <span>热门内容</span>
            <AdminOverviewList items={overview.topContent} emptyText="还没有公开内容数据，发布后会在这里沉淀反馈。" showMetric />
          </div>
          <div className="admin-ops-card">
            <span>近期变更</span>
            <AdminOverviewList items={overview.recentUpdates} emptyText="暂无近期内容变更。" showMetric />
          </div>
        </div>
      </section>

      <section className="admin-workflow-grid" aria-label="常用工作流">
        <Link href="/admin/content/new?type=post">
          <span>写长文</span>
          <strong>文章草稿</strong>
          <small>适合沉淀观点、技术记录和长期专题。</small>
        </Link>
        <Link href="/admin/content/new?type=moment">
          <span>记片段</span>
          <strong>日常瞬间</strong>
          <small>快速记录想法、现场和轻量更新。</small>
        </Link>
        <Link href="/admin/projects">
          <span>维护项目</span>
          <strong>项目档案</strong>
          <small>整理状态、链接、技术栈和项目复盘。</small>
        </Link>
        <Link href="/admin/settings">
          <span>站点配置</span>
          <strong>首页与导航</strong>
          <small>调整首页文案、社交链接和公开导航。</small>
        </Link>
      </section>

      <section className="admin-panel admin-panel--compact">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">Interactions</p>
            <h2>互动管理</h2>
          </div>
          <Link href="/admin/guestbook">处理留言</Link>
        </div>
        <div className="admin-review-strip">
          {moderationCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </Link>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function AdminOverviewList({
  items,
  emptyText,
  showMetric = false,
}: {
  items: Array<{ id: string; title: string; href: string; meta: string; metric: string }>;
  emptyText: string;
  showMetric?: boolean;
}) {
  if (items.length === 0) {
    return <p className="admin-ops-empty">{emptyText}</p>;
  }

  return (
    <ul className="admin-ops-list">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={item.href}>
            <strong>{item.title}</strong>
            <small>{item.meta}</small>
            {showMetric ? <em>{item.metric}</em> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
