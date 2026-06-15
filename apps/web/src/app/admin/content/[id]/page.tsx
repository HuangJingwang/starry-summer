import { notFound } from 'next/navigation';

import { AdminContentForm } from '@/components/AdminContentForm';
import { AdminShell } from '@/components/AdminShell';
import { buildAdminContentItemSourceNotice } from '@/lib/admin-content';
import { loadRepositoryAdminContentItem } from '@/lib/admin-content-repository';

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { item, source } = await loadRepositoryAdminContentItem(id);

  if (!item) {
    notFound();
  }

  const sourceNotice = buildAdminContentItemSourceNotice(source);

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">编辑</p>
        <h1>{item.title}</h1>
        <p className={`admin-data-note admin-data-note--${sourceNotice.tone}`}>{sourceNotice.text}</p>
        <AdminContentForm
          mode="edit"
          initialValue={{
            ...item,
            bodyMarkdown: item.bodyMarkdown || `# ${item.title}\n\n${item.summary ?? ''}`,
            allowComments: item.allowComments ?? true,
            pinned: item.pinned ?? false,
          }}
        />
      </section>
    </AdminShell>
  );
}
