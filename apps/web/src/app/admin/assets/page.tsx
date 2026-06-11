import { AdminShell } from '@/components/AdminShell';
import { AssetManager } from '@/components/AssetManager';

export default function AdminAssetsPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">素材</p>
        <h1>图片与附件</h1>
        <AssetManager />
      </section>
    </AdminShell>
  );
}
