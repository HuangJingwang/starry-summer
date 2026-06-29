import { AdminShell } from '@/components/AdminShell';
import { SettingsManager } from '@/components/SettingsManager';
import { loadSiteSettings } from '@/lib/settings-repository';

export default async function AdminSettingsPage() {
  const settings = await loadSiteSettings();

  return (
    <AdminShell>
      <section className="admin-panel wide admin-panel--settings">
        <p className="eyebrow">设置</p>
        <h1>站点配置</h1>
        <SettingsManager initialSettings={settings} />
      </section>
    </AdminShell>
  );
}
