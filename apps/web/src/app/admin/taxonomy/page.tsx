import { AdminShell } from '@/components/AdminShell';

export default function AdminTaxonomyPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Taxonomy</p>
        <h1>分类、标签与系列</h1>
        <div className="split-panels">
          <section>
            <h2>Categories</h2>
            <input placeholder="New category" />
          </section>
          <section>
            <h2>Tags</h2>
            <input placeholder="New tag" />
          </section>
          <section>
            <h2>Series</h2>
            <input placeholder="New series" />
          </section>
        </div>
      </section>
    </AdminShell>
  );
}
