import { AdminShell } from '@/components/AdminShell';

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Settings</p>
        <h1>站点配置</h1>
        <form className="content-form">
          <div className="form-grid">
            <label>
              Site title
              <input defaultValue="Starry Summer" />
            </label>
            <label>
              Owner
              <input defaultValue="Owner" />
            </label>
          </div>
          <label>
            SEO description
            <textarea rows={4} defaultValue="A personal content platform for writing, notes, moments, projects, and reader interaction." />
          </label>
          <button type="button">Save settings</button>
        </form>
      </section>
    </AdminShell>
  );
}
