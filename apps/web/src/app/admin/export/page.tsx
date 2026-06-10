import { AdminShell } from '@/components/AdminShell';

export default function AdminExportPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Markdown ownership</p>
        <h1>导入与导出</h1>
        <div className="split-panels">
          <section>
            <h2>Export</h2>
            <p>导出数据库中的文章、笔记、日常和项目为带 front matter 的 Markdown 文件。</p>
            <button type="button">Export Markdown</button>
          </section>
          <section>
            <h2>Import</h2>
            <p>从 Markdown 文件恢复内容，保留 slug、摘要、状态和可见性。</p>
            <textarea rows={10} placeholder="---&#10;title: Imported Post&#10;slug: imported-post&#10;---&#10;# Imported Post" />
            <button type="button">Import Markdown</button>
          </section>
        </div>
      </section>
    </AdminShell>
  );
}
