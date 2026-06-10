import { AdminShell } from '@/components/AdminShell';
import { AdminMarkdownTransfer } from '@/components/AdminMarkdownTransfer';

export default function AdminExportPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Markdown ownership</p>
        <h1>导入与导出</h1>
        <AdminMarkdownTransfer />
      </section>
    </AdminShell>
  );
}
