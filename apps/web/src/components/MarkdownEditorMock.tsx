'use client';

import { useMemo, useState } from 'react';

import { createMarkdownPreview } from '@/lib/admin-content';

const defaultMarkdown = [
  '# 新内容标题',
  '',
  '这里写摘要和正文。后台会在后续阶段接入真实 API 保存、发布和导出。',
  '',
  '## 小节',
  '',
  '- 支持 Markdown',
  '- 支持预览',
  '- 支持草稿和发布工作流',
].join('\n');

export function MarkdownEditorMock() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const preview = useMemo(() => createMarkdownPreview(markdown), [markdown]);

  return (
    <div className="editor-grid">
      <section className="editor-pane">
        <label htmlFor="markdown-body">Markdown</label>
        <textarea
          id="markdown-body"
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          rows={18}
        />
      </section>
      <section className="preview-pane" aria-live="polite">
        <p className="eyebrow">Preview</p>
        <h2>{preview.title}</h2>
        <p>{preview.excerpt}</p>
        <span>{preview.wordCount} words</span>
      </section>
    </div>
  );
}
