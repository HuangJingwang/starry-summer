import { AdminShell } from '@/components/AdminShell';
import { SettingsManager } from '@/components/SettingsManager';

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">设置</p>
        <h1>站点配置</h1>
        <SettingsManager />
      </section>
    </AdminShell>
  );
}
