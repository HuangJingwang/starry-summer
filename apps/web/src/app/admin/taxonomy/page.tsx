import { AdminShell } from '@/components/AdminShell';
import { TaxonomyManager } from '@/components/TaxonomyManager';

export default function AdminTaxonomyPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Taxonomy</p>
        <h1>分类、标签与系列</h1>
        <TaxonomyManager />
      </section>
    </AdminShell>
  );
}
