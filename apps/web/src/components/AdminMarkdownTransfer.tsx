'use client';

const exampleMarkdown = [
  '---',
  'title: 导入示例',
  'slug: imported-post',
  'summary: 从 Markdown 迁移到仓库内容文件',
  '---',
  '# 导入示例',
].join('\n');

export function AdminMarkdownTransfer() {
  const transferBusy = true;

  return (
    <div className="admin-transfer">
      <section className="admin-transfer-card" aria-busy={transferBusy}>
        <div className="admin-transfer-card__header">
          <span>Repository</span>
          <h2>仓库内容迁移</h2>
          <p>旧数据库的 Markdown 导入导出接口已经停用。现在内容通过仓库文件和 Git 提交流程沉淀。</p>
        </div>
        <div className="admin-import-checklist">
          <strong>推荐迁移方式</strong>
          <ul>
            <li>公开内容索引维护在 apps/web/content/public-content.json。</li>
            <li>正文文件按类型放在 apps/web/content/posts、notes、moments、projects 或 pages 下。</li>
            <li>后台编辑器只保留本地草稿和预览，持久化修改需要编辑仓库内容文件并提交 Git。</li>
          </ul>
        </div>
        <label>
          Markdown 文件示例
          <textarea rows={8} value={exampleMarkdown} readOnly />
        </label>
        <div className="admin-transfer-actions">
          <button type="button" disabled={transferBusy} aria-disabled={transferBusy}>
            数据库导出已停用
          </button>
          <button type="button" disabled={transferBusy} aria-disabled={transferBusy}>
            数据库导入已停用
          </button>
        </div>
      </section>
      <p className="form-message form-message--idle" role="status" aria-live="polite">
        仓库模式下不再调用旧的 Markdown 导入导出 API；请通过 Git 文件、后台编辑器或后续 GitHub 导入脚本迁移。
      </p>
    </div>
  );
}
