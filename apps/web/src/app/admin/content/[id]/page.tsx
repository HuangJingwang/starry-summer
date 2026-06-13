import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { AdminContentForm } from '@/components/AdminContentForm';
import { AdminShell } from '@/components/AdminShell';
import { seedContent } from '@/lib/content';
import { buildAdminContentItemSourceNotice, loadAdminContentItem } from '@/lib/admin-content';

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();
  const { item, source } = await loadAdminContentItem(id, seedContent, undefined, {
    apiBaseUrl: process.env.API_BASE_URL,
    cookieHeader,
  });

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
