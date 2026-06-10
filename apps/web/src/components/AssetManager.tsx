'use client';

import { useState } from 'react';

import {
  buildAssetUploadPayload,
  buildAssetUploadRequest,
  normalizeStoredAsset,
  type StoredAsset,
} from '@/lib/assets';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

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
  const [assets, setAssets] = useState<StoredAsset[]>([]);

  async function upload(formData: FormData) {
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      setState('error');
      setMessage('请选择要上传的文件。');
      return;
    }

    setState('uploading');
    setMessage('');

    try {
      const payload = await buildAssetUploadPayload(file);
      const request = buildAssetUploadRequest(payload);
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const stored = normalizeStoredAsset(await response.json());
      setAssets((current) => [stored, ...current]);
      setState('success');
      setMessage('上传完成。');
    } catch {
      setState('error');
      setMessage('上传失败，请确认已登录且文件类型符合要求。');
    }
  }

  return (
    <div className="asset-manager">
      <form className="asset-dropzone" action={upload}>
        <strong>上传图片或附件</strong>
        <input name="file" type="file" accept="image/*,.pdf,.txt,.md,text/markdown" />
        <button type="submit" disabled={state === 'uploading'}>
          {state === 'uploading' ? 'Uploading' : 'Upload'}
        </button>
      </form>
      {message ? <p className={`form-message form-message--${state}`}>{message}</p> : null}
      {assets.length > 0 ? (
        <div className="asset-list" aria-label="Uploaded assets">
          {assets.map((asset) => (
            <article key={asset.storageKey} className="asset-item">
              <div>
                <strong>{asset.storageKey}</strong>
                <span>
                  {asset.mimeType} · {formatBytes(asset.byteSize)}
                </span>
              </div>
              <a href={asset.publicUrl} target="_blank" rel="noreferrer">
                {asset.publicUrl}
              </a>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
