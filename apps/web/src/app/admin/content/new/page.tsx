import { AdminShell } from '@/components/AdminShell';
import { AdminContentForm } from '@/components/AdminContentForm';
import { getInitialContentTypeFromSearchParams } from '@/lib/admin-content';

export default async function NewContentPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const initialType = getInitialContentTypeFromSearchParams(await searchParams);

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">新建</p>
        <h1>新建内容</h1>
        <AdminContentForm mode="create" initialValue={initialType ? { type: initialType } : undefined} />
      </section>
    </AdminShell>
  );
}
