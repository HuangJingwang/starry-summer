import { AdminShell } from '@/components/AdminShell';
import { AdminContentForm } from '@/components/AdminContentForm';

export default function NewProjectPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">项目</p>
            <h1>新建项目</h1>
            <p>记录项目目标、状态、技术栈、链接和复盘内容，保存后会进入项目管理列表。</p>
          </div>
        </div>
        <AdminContentForm mode="create" initialValue={{ type: 'project' }} />
      </section>
    </AdminShell>
  );
}
