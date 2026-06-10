import Link from 'next/link';

export default function AdminPage() {
  return (
    <main className="admin-main">
      <section className="admin-panel">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>创作后台</h1>
          <p>管理文章、笔记、日常、项目、评论、留言和站点配置。</p>
        </div>
        <div className="admin-grid">
          <span>Drafts 1</span>
          <span>Pending comments 0</span>
          <span>Guestbook review 0</span>
          <span>Assets 1</span>
        </div>
        <Link href="/admin/login">进入登录</Link>
      </section>
    </main>
  );
}
