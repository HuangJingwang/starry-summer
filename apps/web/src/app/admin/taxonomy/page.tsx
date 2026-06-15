import { AdminShell } from '@/components/AdminShell';
import { TaxonomyManager } from '@/components/TaxonomyManager';
import { loadSiteContent } from '@/lib/public-content';
import { buildTaxonomyTermsFromContent } from '@/lib/taxonomy';

export default async function AdminTaxonomyPage() {
  const initialTerms = buildTaxonomyTermsFromContent(await loadSiteContent());

  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">分类</p>
        <h1>分类、标签与系列</h1>
        <TaxonomyManager initialTerms={initialTerms} repositoryMode />
      </section>
    </AdminShell>
  );
}
