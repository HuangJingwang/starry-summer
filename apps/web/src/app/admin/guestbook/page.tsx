import { AdminShell } from '@/components/AdminShell';
import { ModerationManager } from '@/components/ModerationManager';

export default function AdminGuestbookPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">留言</p>
        <h1>留言管理</h1>
        <ModerationManager resource="guestbook" emptyText="暂无留言需要处理。" />
      </section>
    </AdminShell>
  );
}
