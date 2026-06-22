'use client';

import { useEffect, useState } from 'react';

import {
  buildAdminAssetListRequest,
  buildAssetDeleteRequest,
  buildMarkdownAssetEmbed,
  buildAssetUploadPayload,
  buildAssetUploadRequest,
  normalizeStoredAsset,
  readAssetErrorMessage,
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
  const [selectedFileName, setSelectedFileName] = useState('');
  const assetBusy = state === 'uploading';

  useEffect(() => {
    void loadAssets(usage);
  }, [usage]);

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

      if (!request) {
        throw new Error('仓库素材发布未配置，暂时不能上传素材。');
      }

      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(await readAssetErrorMessage(response, `上传失败，服务器返回 ${response.status}。`));
      }

      const stored = normalizeStoredAsset(await response.json());
      setAssets((current) => [stored, ...current]);
      setState('success');
      setMessage('上传完成。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '上传失败，请确认已登录且文件类型符合要求。');
    }
  }

  async function loadAssets(nextUsage = usage) {
    setState('uploading');
    setMessage('');

    try {
      const request = buildAdminAssetListRequest({ usage: nextUsage });

      if (!request) {
        setAssets([]);
        setState('error');
        setMessage('仓库素材发布未配置，暂时不能读取素材库。');
        return;
      }

      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(await readAssetErrorMessage(response, '读取图库失败，请确认已登录且仓库发布配置可用。'));
      }

      const data: unknown = await response.json();
      setAssets(Array.isArray(data) ? data.map((item) => normalizeStoredAsset(item)) : []);
      setState('success');
      setMessage('图库已更新。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '读取图库失败，请确认已登录且仓库发布配置可用。');
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

      if (!request) {
        throw new Error('仓库素材发布未配置，暂时不能删除素材。');
      }

      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(await readAssetErrorMessage(response, '删除失败，请确认已登录且仓库发布配置可用。'));
      }

      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setState('success');
      setMessage('资源已删除。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '删除失败，请确认已登录且仓库发布配置可用。');
    }
  }

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
      <form className="asset-dropzone" action={upload} aria-busy={assetBusy}>
        <div className="asset-upload-copy">
          <span>上传</span>
          <strong>上传图片或附件</strong>
          <p>选择用途、补充替代文本，再上传到素材库。封面图会出现在编辑器的封面选择器里。</p>
        </div>
        <div className="asset-upload-grid">
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
          <label className="asset-file-picker">
            <input
              name="file"
              type="file"
              accept="image/*,.pdf,.txt,.md,text/markdown"
              onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? '')}
            />
            <span>选择文件</span>
            <strong>{selectedFileName || '还没有选择文件'}</strong>
            <small>支持图片、PDF、Markdown、文本</small>
          </label>
        </div>
        <div className="asset-upload-actions">
          <button type="submit" disabled={assetBusy} aria-disabled={assetBusy}>
            {assetBusy ? '上传中' : '上传素材'}
          </button>
          <button type="button" onClick={() => loadAssets()} disabled={assetBusy} aria-disabled={assetBusy}>
            刷新图库
          </button>
        </div>
      </form>
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
                <button type="button" onClick={() => deleteAsset(asset)} disabled={assetBusy} aria-disabled={assetBusy}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
