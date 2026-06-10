import { AdminShell } from '@/components/AdminShell';
import { MarkdownEditorMock } from '@/components/MarkdownEditorMock';

export default function NewContentPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Create</p>
        <h1>新建内容</h1>
        <form className="content-form">
          <div className="form-grid">
            <label>
              标题
              <input placeholder="例如：一次系统重构记录" />
            </label>
            <label>
              Slug
              <input placeholder="system-refactor-notes" />
            </label>
            <label>
              类型
              <select defaultValue="post">
                <option value="post">Post</option>
                <option value="note">Note</option>
                <option value="moment">Moment</option>
                <option value="project">Project</option>
              </select>
            </label>
            <label>
              状态
              <select defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="private">Private</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <label>
            摘要
            <textarea rows={3} placeholder="用于列表页、SEO 和 RSS 的短摘要" />
          </label>
          <MarkdownEditorMock />
          <div className="admin-actions">
            <button type="button">Save draft</button>
            <button type="button">Publish</button>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
