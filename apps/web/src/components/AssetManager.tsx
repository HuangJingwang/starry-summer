'use client';

import { useState } from 'react';

import {
  buildAdminAssetListRequest,
  buildAssetDeleteRequest,
  buildAssetUploadPayload,
  buildAssetUploadRequest,
  normalizeStoredAsset,
  type AssetUsage,
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
  const [usage, setUsage] = useState<AssetUsage>('content');

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
      const payload = {
        ...(await buildAssetUploadPayload(file)),
        usage: formData.get('usage') as AssetUsage,
        altText: String(formData.get('altText') ?? ''),
      };
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

  async function loadAssets(nextUsage = usage) {
    setState('uploading');
    setMessage('');

    try {
      const request = buildAdminAssetListRequest({ usage: nextUsage });
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const data: unknown = await response.json();
      setAssets(Array.isArray(data) ? data.map((item) => normalizeStoredAsset(item)) : []);
      setState('success');
      setMessage('图库已更新。');
    } catch {
      setState('error');
      setMessage('读取图库失败，请确认已登录且 API 服务可用。');
    }
  }

  async function deleteAsset(asset: StoredAsset) {
    if (!window.confirm(`删除资源 ${asset.storageKey}?`)) {
      return;
    }

    setState('uploading');
    setMessage('');

    try {
      const request = buildAssetDeleteRequest(asset.id);
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setState('success');
      setMessage('资源已删除。');
    } catch {
      setState('error');
      setMessage('删除失败，请确认已登录且 API 服务可用。');
    }
  }

  return (
    <div className="asset-manager">
      <form className="asset-dropzone" action={upload}>
        <strong>上传图片或附件</strong>
        <label>
          用途
          <select
            name="usage"
            value={usage}
            onChange={(event) => setUsage(event.target.value as AssetUsage)}
          >
            <option value="content">正文</option>
            <option value="cover">封面</option>
            <option value="background">背景</option>
            <option value="attachment">附件</option>
          </select>
        </label>
        <label>
          替代文本
          <input name="altText" placeholder="图片说明" />
        </label>
        <input name="file" type="file" accept="image/*,.pdf,.txt,.md,text/markdown" />
        <button type="submit" disabled={state === 'uploading'}>
          {state === 'uploading' ? 'Uploading' : 'Upload'}
        </button>
        <button type="button" onClick={() => loadAssets()} disabled={state === 'uploading'}>
          刷新图库
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
                  {asset.usage} · {asset.mimeType} · {formatBytes(asset.byteSize)}
                </span>
              </div>
              <a href={asset.publicUrl} target="_blank" rel="noreferrer">
                {asset.publicUrl}
              </a>
              <button type="button" onClick={() => deleteAsset(asset)} disabled={state === 'uploading'}>
                Delete
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
