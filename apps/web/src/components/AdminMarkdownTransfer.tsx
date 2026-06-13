'use client';

import { useState } from 'react';
import type { ContentType } from '@starry-summer/shared';

import {
  buildExportAllMarkdownRequest,
  buildExportMarkdownRequest,
  buildImportMarkdownArchiveRequest,
  buildImportMarkdownRequest,
} from '@/lib/admin-content';

type TransferState = 'idle' | 'submitting' | 'success' | 'error';

const exampleMarkdown = ['---', 'title: 导入示例', 'slug: imported-post', 'summary: 从 Markdown 导入', '---', '# 导入示例'].join('\n');

export function AdminMarkdownTransfer() {
  const [exportedMarkdown, setExportedMarkdown] = useState('');
  const [exportFilename, setExportFilename] = useState('starry-summer-export.md');
  const [state, setState] = useState<TransferState>('idle');
  const [message, setMessage] = useState('');
  const transferBusy = state === 'submitting';

  async function exportMarkdown(formData: FormData) {
    setState('submitting');
    setMessage('');
    const id = String(formData.get('contentId') ?? '').trim();

    try {
      const request = buildExportMarkdownRequest(id);
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Export failed with ${response.status}`);
      }

      const markdown = await response.text();
      setExportedMarkdown(markdown);
      setExportFilename(`starry-summer-${id || 'export'}.md`);
      setState('success');
      setMessage('Markdown 已导出，可以下载或复制保存。');
    } catch {
      setState('error');
      setMessage('导出失败，请确认内容 ID 正确且已登录。');
    }
  }

  async function exportAllMarkdown() {
    setState('submitting');
    setMessage('');

    try {
      const request = buildExportAllMarkdownRequest();
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Export failed with ${response.status}`);
      }

      const markdown = await response.text();
      setExportedMarkdown(markdown);
      setExportFilename('starry-summer-export-all.md');
      setState('success');
      setMessage('全部 Markdown 已导出，可以下载或复制保存。');
    } catch {
      setState('error');
      setMessage('全量导出失败，请确认已登录且 API 服务可用。');
    }
  }

  async function importMarkdown(formData: FormData) {
    setState('submitting');
    setMessage('');

    try {
      const request = buildImportMarkdownRequest({
        type: String(formData.get('type') ?? 'post') as ContentType,
        markdown: String(formData.get('markdown') ?? ''),
      });
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Import failed with ${response.status}`);
      }

      const result = (await response.json()) as { id?: string; title?: string };
      setState('success');
      setMessage(result.id ? `已导入为草稿：${result.title ?? result.id}` : '已导入为草稿。');
    } catch {
      setState('error');
      setMessage('导入失败，请确认 Markdown 内容有效且已登录。');
    }
  }

  async function importMarkdownArchive(formData: FormData) {
    setState('submitting');
    setMessage('');

    try {
      const request = buildImportMarkdownArchiveRequest({
        markdown: String(formData.get('markdown') ?? ''),
      });
      const response = await fetch(request.url, request.init);

      if (!response.ok) {
        throw new Error(`Archive import failed with ${response.status}`);
      }

      const result = (await response.json()) as Array<{ id?: string }>;
      setState('success');
      setMessage(`已从归档导入 ${Array.isArray(result) ? result.length : 0} 篇草稿。`);
    } catch {
      setState('error');
      setMessage('归档导入失败，请确认这是 Starry Summer 全量导出的 Markdown 文件。');
    }
  }

  function downloadExport() {
    const blob = new Blob([exportedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-transfer">
      <form className="admin-transfer-card" action={exportMarkdown} aria-busy={transferBusy}>
        <div className="admin-transfer-card__header">
          <span>Export</span>
          <h2>导出</h2>
          <p>按内容 ID 导出带 front matter 的 Markdown，也可以一次打包全部内容。</p>
        </div>
        <label>
          内容 ID
          <input name="contentId" placeholder="例如：post-2026-archive" required />
        </label>
        <div className="admin-transfer-actions">
          <button type="submit" disabled={transferBusy} aria-disabled={transferBusy}>
            导出 Markdown
          </button>
          <button type="button" onClick={exportAllMarkdown} disabled={transferBusy} aria-disabled={transferBusy}>
            导出全部
          </button>
        </div>
        {exportedMarkdown ? (
          <div className="admin-export-preview">
            <div>
              <strong>导出结果</strong>
              <span>{exportFilename}</span>
            </div>
            <textarea rows={12} value={exportedMarkdown} readOnly aria-label="已导出的 Markdown" />
            <button type="button" onClick={downloadExport}>
              下载 .md
            </button>
          </div>
        ) : null}
      </form>
      <form className="admin-transfer-card" action={importMarkdown} aria-busy={transferBusy}>
        <div className="admin-transfer-card__header">
          <span>Import</span>
          <h2>导入</h2>
          <p>从 Markdown 恢复内容，导入后先作为草稿进入内容管理。</p>
        </div>
        <div className="admin-import-checklist">
          <strong>导入前检查</strong>
          <ul>
            <li>单篇导入会使用下方选择的内容类型，归档导入会读取 Starry Summer 导出标记。</li>
            <li>建议保留 title、slug、summary、tags、categories 等 front matter，方便导入后继续管理。</li>
            <li>同 slug 内容会被后端拒绝；如果要保留两份内容，请先修改 slug 后再导入。</li>
          </ul>
        </div>
        <label>
          内容类型
          <select name="type" defaultValue="post" aria-label="内容类型">
            <option value="post">文章</option>
            <option value="moment">日常</option>
            <option value="project">项目</option>
            <option value="page">页面</option>
          </select>
        </label>
        <label>
          Markdown 内容
        <textarea name="markdown" rows={12} defaultValue={exampleMarkdown} />
        </label>
        <div className="admin-transfer-actions">
          <button type="submit" disabled={transferBusy} aria-disabled={transferBusy}>
            导入 Markdown
          </button>
          <button type="submit" formAction={importMarkdownArchive} disabled={transferBusy} aria-disabled={transferBusy}>
            导入归档
          </button>
        </div>
      </form>
      {message ? <p className={`form-message form-message--${state}`} role="status" aria-live="polite">{message}</p> : null}
    </div>
  );
}
