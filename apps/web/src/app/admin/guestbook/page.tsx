import { AdminShell } from '@/components/AdminShell';

export default function AdminGuestbookPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Guestbook</p>
        <h1>留言审核</h1>
        <div className="moderation-list">
          <article>
            <span>Pending</span>
            <p>留言板内容默认待审核，避免公网垃圾内容直接展示。</p>
            <div className="admin-actions">
              <button type="button">Approve</button>
              <button type="button">Reject</button>
            </div>
          </article>
        </div>
      </section>
    </AdminShell>
  );
}
