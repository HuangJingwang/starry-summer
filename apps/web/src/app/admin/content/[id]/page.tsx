import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/AdminShell';
import { MarkdownEditorMock } from '@/components/MarkdownEditorMock';
import { seedContent } from '@/lib/content';

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = seedContent.find((content) => content.id === id);

  if (!item) {
    notFound();
  }

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Edit</p>
        <h1>{item.title}</h1>
        <form className="content-form">
          <div className="form-grid">
            <label>
              标题
              <input defaultValue={item.title} />
            </label>
            <label>
              Slug
              <input defaultValue={item.slug} />
            </label>
            <label>
              类型
              <select defaultValue={item.type}>
                <option value="post">Post</option>
                <option value="note">Note</option>
                <option value="moment">Moment</option>
                <option value="project">Project</option>
                <option value="page">Page</option>
              </select>
            </label>
            <label>
              状态
              <select defaultValue={item.status}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="private">Private</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <label>
            摘要
            <textarea rows={3} defaultValue={item.summary} />
          </label>
          <MarkdownEditorMock />
          <div className="admin-actions">
            <button type="button">Save</button>
            <button type="button">Archive</button>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
