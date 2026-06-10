import { AdminShell } from '@/components/AdminShell';

export default function AdminCommentsPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Moderation</p>
        <h1>评论审核</h1>
        <div className="moderation-list">
          <article>
            <span>Pending</span>
            <p>评论默认进入待审核队列，通过后才公开显示。</p>
            <div className="admin-actions">
              <button type="button">Approve</button>
              <button type="button">Reject</button>
              <button type="button">Spam</button>
            </div>
          </article>
        </div>
      </section>
    </AdminShell>
  );
}
