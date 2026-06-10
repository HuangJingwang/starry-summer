'use client';

import { useMemo, useState } from 'react';
import type { ContentStatus, ContentType } from '@starry-summer/shared';

import {
  buildAdminContentActionRequest,
  buildContentPayloadFromFormData,
  buildCreateDraftRequest,
  buildUpdateContentRequest,
  createMarkdownPreview,
} from '@/lib/admin-content';

interface AdminContentFormInitialValue {
  id?: string;
  title?: string;
  slug?: string;
  type?: ContentType;
  status?: ContentStatus;
  summary?: string;
  bodyMarkdown?: string;
  categories?: string[];
  tags?: string[];
  allowComments?: boolean;
  pinned?: boolean;
  featured?: boolean;
}

interface AdminContentFormProps {
  mode: 'create' | 'edit';
  initialValue?: AdminContentFormInitialValue;
}

type SaveState = 'idle' | 'submitting' | 'success' | 'error';

const fallbackMarkdown = '# 新内容标题\n\n这里写正文。';

export function AdminContentForm({ mode, initialValue }: AdminContentFormProps) {
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const [markdown, setMarkdown] = useState(initialValue?.bodyMarkdown ?? fallbackMarkdown);
  const preview = useMemo(() => createMarkdownPreview(markdown), [markdown]);

  async function send(request: { url: string; init: RequestInit }) {
    const response = await fetch(request.url, request.init);

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return response.json().catch(() => null);
  }

  async function save(formData: FormData): Promise<string | undefined> {
    const payload = buildContentPayloadFromFormData(formData);
    const request =
      mode === 'edit' && initialValue?.id
        ? buildUpdateContentRequest(initialValue.id, payload)
        : buildCreateDraftRequest(payload);
    const result = await send(request);

    return typeof result?.id === 'string' ? result.id : initialValue?.id;
  }

  async function runSave(formData: FormData, lifecycle?: 'publish' | 'archive' | 'restore-draft') {
    setState('submitting');
    setMessage('');

    try {
      const contentId = lifecycle === 'archive' || lifecycle === 'restore-draft' ? initialValue?.id : await save(formData);

      if (lifecycle && contentId) {
        await send(buildAdminContentActionRequest(contentId, lifecycle));
      }

      setState('success');
      setMessage(lifecycle === 'publish' ? '已保存并发布。' : lifecycle === 'archive' ? '已归档。' : lifecycle === 'restore-draft' ? '已恢复为草稿。' : '已保存草稿。');
    } catch {
      setState('error');
      setMessage('保存失败，请确认已登录且 API 服务可用。');
    }
  }

  return (
    <form className="content-form" action={(formData) => runSave(formData)}>
      <div className="form-grid">
        <label>
          标题
          <input name="title" defaultValue={initialValue?.title ?? ''} placeholder="例如：一次系统重构记录" required />
        </label>
        <label>
          Slug
          <input name="slug" defaultValue={initialValue?.slug ?? ''} placeholder="system-refactor-notes" required />
        </label>
        <label>
          类型
          <select name="type" defaultValue={initialValue?.type ?? 'post'}>
            <option value="post">Post</option>
            <option value="note">Note</option>
            <option value="moment">Moment</option>
            <option value="project">Project</option>
            <option value="page">Page</option>
          </select>
        </label>
        <label>
          状态
          <input value={initialValue?.status ?? 'draft'} readOnly />
        </label>
      </div>
      <label>
        摘要
        <textarea name="summary" rows={3} defaultValue={initialValue?.summary ?? ''} placeholder="用于列表页、SEO 和 RSS 的短摘要" />
      </label>
      <div className="form-grid">
        <label>
          分类
          <input name="categories" defaultValue={(initialValue?.categories ?? []).join(', ')} placeholder="Writing, Platform" />
        </label>
        <label>
          标签
          <input name="tags" defaultValue={(initialValue?.tags ?? []).join(', ')} placeholder="Markdown, Next.js" />
        </label>
      </div>
      <div className="form-options">
        <label>
          <input name="allowComments" type="checkbox" defaultChecked={initialValue?.allowComments ?? true} />
          允许评论
        </label>
        <label>
          <input name="featured" type="checkbox" defaultChecked={initialValue?.featured ?? false} />
          Featured
        </label>
        <label>
          <input name="pinned" type="checkbox" defaultChecked={initialValue?.pinned ?? false} />
          Pinned
        </label>
      </div>
      <div className="editor-grid">
        <section className="editor-pane">
          <label htmlFor="markdown-body">Markdown</label>
          <textarea
            id="markdown-body"
            name="bodyMarkdown"
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
      <div className="admin-actions">
        <button type="submit" disabled={state === 'submitting'}>
          {state === 'submitting' ? 'Saving' : 'Save draft'}
        </button>
        <button type="submit" formAction={(formData) => runSave(formData, 'publish')} disabled={state === 'submitting'}>
          Publish
        </button>
        {mode === 'edit' ? (
          <>
            <button type="submit" formAction={(formData) => runSave(formData, 'archive')} disabled={state === 'submitting'}>
              Archive
            </button>
            <button type="submit" formAction={(formData) => runSave(formData, 'restore-draft')} disabled={state === 'submitting'}>
              Restore draft
            </button>
          </>
        ) : null}
      </div>
      {message ? <p className={`form-message form-message--${state}`}>{message}</p> : null}
    </form>
  );
}
