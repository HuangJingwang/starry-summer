'use client';

import { useState } from 'react';
import type { ContentType } from '@starry-summer/shared';

import { buildExportMarkdownRequest, buildImportMarkdownRequest } from '@/lib/admin-content';

type TransferState = 'idle' | 'submitting' | 'success' | 'error';

const exampleMarkdown = ['---', 'title: Imported Post', 'slug: imported-post', 'summary: Imported from Markdown', '---', '# Imported Post'].join('\n');

export function AdminMarkdownTransfer() {
  const [exportedMarkdown, setExportedMarkdown] = useState('');
  const [state, setState] = useState<TransferState>('idle');
  const [message, setMessage] = useState('');

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
      setState('success');
      setMessage('Markdown 已导出，可以下载或复制保存。');
    } catch {
      setState('error');
      setMessage('导出失败，请确认内容 ID 正确且已登录。');
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

  function downloadExport() {
    const blob = new Blob([exportedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'starry-summer-export.md';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="split-panels">
      <form action={exportMarkdown}>
        <h2>Export</h2>
        <p>按内容 ID 导出带 front matter 的 Markdown。</p>
        <input name="contentId" placeholder="content id" required />
        <button type="submit" disabled={state === 'submitting'}>
          Export Markdown
        </button>
        {exportedMarkdown ? (
          <>
            <textarea rows={12} value={exportedMarkdown} readOnly aria-label="Exported Markdown" />
            <button type="button" onClick={downloadExport}>
              Download .md
            </button>
          </>
        ) : null}
      </form>
      <form action={importMarkdown}>
        <h2>Import</h2>
        <p>从 Markdown 恢复内容，导入后先作为草稿进入内容管理。</p>
        <select name="type" defaultValue="post" aria-label="Content type">
          <option value="post">Post</option>
          <option value="note">Note</option>
          <option value="moment">Moment</option>
          <option value="project">Project</option>
          <option value="page">Page</option>
        </select>
        <textarea name="markdown" rows={12} defaultValue={exampleMarkdown} />
        <button type="submit" disabled={state === 'submitting'}>
          Import Markdown
        </button>
      </form>
      {message ? <p className={`form-message form-message--${state}`}>{message}</p> : null}
    </div>
  );
}
