'use client';

import { useState } from 'react';

import {
  buildMarkdownAssetEmbed,
  type StoredAsset,
} from '@/lib/assets';

type UploadState = 'idle' | 'success' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AssetManager() {
  const [state, setState] = useState<UploadState>('idle');
  const [message, setMessage] = useState('');
  const assetBusy = false;
  const assets: StoredAsset[] = [];

  async function copyAssetUrl(asset: StoredAsset) {
    await copyText(asset.publicUrl, 'URL 已复制。');
  }

  async function copyAssetMarkdown(asset: StoredAsset) {
    await copyText(buildMarkdownAssetEmbed(asset), 'Markdown 引用已复制。');
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setState('success');
      setMessage(successMessage);
    } catch {
      setState('error');
      setMessage('复制失败，请手动复制链接。');
    }
  }

  return (
    <div className="asset-manager">
      <section className="asset-dropzone" aria-busy={assetBusy}>
        <div className="asset-upload-copy">
          <span>静态站模式</span>
          <strong>素材通过仓库文件管理</strong>
          <p>把图片或附件放进 apps/web/public/images，再在 Markdown 或内容元数据里引用路径，最后 git commit 并推送发布。</p>
        </div>
        <div className="asset-upload-actions">
          <button type="button" disabled={assetBusy} aria-disabled={assetBusy} onClick={() => {
            setState('success');
            setMessage('请在仓库中添加素材文件，然后通过 git commit/push 发布。');
          }}>
            查看静态流程
          </button>
        </div>
      </section>
      {message ? <p className={`form-message form-message--${state}`} role="status" aria-live="polite">{message}</p> : null}
      {assets.length > 0 ? (
        <div className="asset-list" aria-label="已上传素材">
          {assets.map((asset) => (
            <article key={asset.storageKey} className="asset-item">
              <div className="asset-thumb" aria-label="素材预览">
                {asset.mimeType.startsWith('image/') ? (
                  <img src={asset.publicUrl} alt={asset.altText || asset.storageKey} />
                ) : (
                  <span>{asset.mimeType.split('/').at(-1)?.toUpperCase() ?? 'FILE'}</span>
                )}
              </div>
              <div>
                <strong>{asset.storageKey}</strong>
                <span>
                  {asset.usage} · {asset.mimeType} · {formatBytes(asset.byteSize)}
                </span>
                <code>{asset.id}</code>
              </div>
              <a href={asset.publicUrl} target="_blank" rel="noreferrer">
                {asset.publicUrl}
              </a>
              <div className="asset-item__actions">
                <button type="button" onClick={() => copyAssetUrl(asset)} disabled={assetBusy} aria-disabled={assetBusy}>
                  复制 URL
                </button>
                <button type="button" onClick={() => copyAssetMarkdown(asset)} disabled={assetBusy} aria-disabled={assetBusy}>
                  复制 Markdown
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
