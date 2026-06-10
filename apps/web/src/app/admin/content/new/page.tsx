import { AdminShell } from '@/components/AdminShell';
import { AdminContentForm } from '@/components/AdminContentForm';

export default function NewContentPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Create</p>
        <h1>新建内容</h1>
        <AdminContentForm mode="create" />
      </section>
    </AdminShell>
  );
}
