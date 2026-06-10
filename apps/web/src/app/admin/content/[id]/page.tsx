import { notFound } from 'next/navigation';

import { AdminContentForm } from '@/components/AdminContentForm';
import { AdminShell } from '@/components/AdminShell';
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
        <AdminContentForm
          mode="edit"
          initialValue={{
            ...item,
            bodyMarkdown: `# ${item.title}\n\n${item.summary ?? ''}`,
            allowComments: true,
            pinned: false,
          }}
        />
      </section>
    </AdminShell>
  );
}
