import { AdminShell } from '@/components/AdminShell';

export default function AdminAssetsPage() {
  return (
    <AdminShell>
      <section className="admin-panel wide">
        <p className="eyebrow">Assets</p>
        <h1>图片与附件</h1>
        <div className="asset-dropzone">
          <strong>Upload area</strong>
          <span>生产环境将接入 MinIO 或 S3 兼容对象存储。</span>
        </div>
      </section>
    </AdminShell>
  );
}
