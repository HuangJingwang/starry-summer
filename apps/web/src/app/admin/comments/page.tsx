import { AdminShell } from '@/components/AdminShell';
import { ModerationManager } from '@/components/ModerationManager';

export default function AdminCommentsPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">审核</p>
        <h1>评论审核</h1>
        <ModerationManager resource="comments" emptyText="暂无评论需要处理。" />
      </section>
    </AdminShell>
  );
}
