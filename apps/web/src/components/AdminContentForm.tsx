'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectMetadata } from '@starry-summer/shared';

import {
  buildAdminContentActionRequest,
  buildContentPayloadFromFormData,
  buildCreateDraftRequest,
  buildDeleteContentRequest,
  buildSetContentVisibilityRequest,
  buildUpdateContentRequest,
  createMarkdownPreview,
  getContentDraftStorageKey,
  getUnsavedContentWarning,
  parseContentDraftSnapshot,
  serializeContentDraftSnapshot,
  type ContentDraftSnapshot,
} from '@/lib/admin-content';

interface AdminContentFormInitialValue {
  id?: string;
  title?: string;
  slug?: string;
  type?: ContentType;
  status?: ContentStatus;
  visibility?: ContentVisibility;
  summary?: string;
  bodyMarkdown?: string;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  coverImageUrl?: string;
  coverAltText?: string;
  categories?: string[];
  tags?: string[];
  series?: string[];
  allowComments?: boolean;
  pinned?: boolean;
  featured?: boolean;
  project?: ProjectMetadata;
}

interface AdminContentFormProps {
  mode: 'create' | 'edit';
  initialValue?: AdminContentFormInitialValue;
}

type SaveState = 'idle' | 'submitting' | 'success' | 'error';

const fallbackMarkdown = '# 新内容标题\n\n这里写正文。';

export function AdminContentForm({ mode, initialValue }: AdminContentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const [markdown, setMarkdown] = useState(initialValue?.bodyMarkdown ?? fallbackMarkdown);
  const [contentType, setContentType] = useState<ContentType>(initialValue?.type ?? 'post');
  const [isDirty, setIsDirty] = useState(false);
  const [localDraft, setLocalDraft] = useState<ContentDraftSnapshot | null>(null);
  const [localDraftMessage, setLocalDraftMessage] = useState('');
  const preview = useMemo(() => createMarkdownPreview(markdown), [markdown]);
  const draftStorageKey = useMemo(() => getContentDraftStorageKey(initialValue?.id), [initialValue?.id]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const warning = getUnsavedContentWarning(isDirty);

      if (!warning) {
        return;
      }

      event.preventDefault();
      event.returnValue = warning;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    try {
      setLocalDraft(parseContentDraftSnapshot(window.localStorage.getItem(draftStorageKey)));
    } catch {
      setLocalDraft(null);
    }
  }, [draftStorageKey]);

  function readDraftSnapshot(): ContentDraftSnapshot | null {
    if (!formRef.current) {
      return null;
    }

    const formData = new FormData(formRef.current);
    const visibility = formData.get('visibility') === 'private' ? 'private' : 'public';

    return {
      title: String(formData.get('title') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      summary: String(formData.get('summary') ?? ''),
      visibility,
      bodyMarkdown: String(formData.get('bodyMarkdown') ?? markdown),
      savedAt: new Date().toISOString(),
    };
  }

  function saveLocalDraft() {
    const snapshot = readDraftSnapshot();

    if (!snapshot) {
      return;
    }

    try {
      window.localStorage.setItem(draftStorageKey, serializeContentDraftSnapshot(snapshot));
      setLocalDraft(snapshot);
      setLocalDraftMessage(`本地草稿已保存 ${snapshot.savedAt.slice(11, 16)}`);
    } catch {
      setLocalDraftMessage('本地草稿保存失败。');
    }
  }

  function markDirtyAndSaveLocalDraft() {
    setIsDirty(true);
    saveLocalDraft();
  }

  function recoverLocalDraft() {
    if (!localDraft || !formRef.current) {
      return;
    }

    const controls = formRef.current.elements as HTMLFormControlsCollection & {
      title?: HTMLInputElement;
      slug?: HTMLInputElement;
      summary?: HTMLTextAreaElement;
      visibility?: HTMLSelectElement;
    };

    if (controls.title) {
      controls.title.value = localDraft.title;
    }

    if (controls.slug) {
      controls.slug.value = localDraft.slug;
    }

    if (controls.summary) {
      controls.summary.value = localDraft.summary;
    }

    if (controls.visibility) {
      controls.visibility.value = localDraft.visibility;
    }

    setMarkdown(localDraft.bodyMarkdown);
    setIsDirty(true);
    setLocalDraftMessage('已恢复本地草稿，保存后会清除本地副本。');
  }

  function discardLocalDraft() {
    try {
      window.localStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore localStorage cleanup errors.
    }

    setLocalDraft(null);
    setLocalDraftMessage('');
  }

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

  async function syncVisibility(contentId: string, formData: FormData) {
    const visibility = formData.get('visibility') === 'private' ? 'private' : 'public';
    await send(buildSetContentVisibilityRequest(contentId, visibility));
  }

  async function runSave(formData: FormData, lifecycle?: 'publish' | 'archive' | 'restore-draft') {
    setState('submitting');
    setMessage('');

    try {
      const contentId = lifecycle === 'archive' || lifecycle === 'restore-draft' ? initialValue?.id : await save(formData);

      if (contentId && lifecycle !== 'archive' && lifecycle !== 'restore-draft') {
        await syncVisibility(contentId, formData);
      }

      if (lifecycle && contentId) {
        await send(buildAdminContentActionRequest(contentId, lifecycle));
      }

      try {
        window.localStorage.removeItem(draftStorageKey);
      } catch {
        // Ignore localStorage cleanup errors after a successful remote save.
      }

      setLocalDraft(null);
      setLocalDraftMessage('');
      setIsDirty(false);
      setState('success');
      setMessage(lifecycle === 'publish' ? '已保存并发布。' : lifecycle === 'archive' ? '已归档。' : lifecycle === 'restore-draft' ? '已恢复为草稿。' : '已保存草稿。');
    } catch {
      setState('error');
      setMessage('保存失败，请确认已登录且 API 服务可用。');
    }
  }

  async function runDelete() {
    if (!initialValue?.id || !window.confirm('Permanently delete this archived content?')) {
      return;
    }

    setState('submitting');
    setMessage('');

    try {
      await send(buildDeleteContentRequest(initialValue.id));
      setState('success');
      setMessage('已永久删除。');
    } catch {
      setState('error');
      setMessage('删除失败，请先确认内容已归档且 API 服务可用。');
    }
  }

  return (
    <form ref={formRef} className="content-form" action={(formData) => runSave(formData)} onInput={markDirtyAndSaveLocalDraft}>
      {localDraft ? (
        <div className="local-draft-banner">
          <div>
            <strong>{isDirty ? '本地自动保存' : '发现本地草稿'}</strong>
            <span>保存于 {localDraft.savedAt.replace('T', ' ').slice(0, 16)}</span>
          </div>
          {!isDirty ? (
            <>
              <button type="button" onClick={recoverLocalDraft}>恢复</button>
              <button type="button" onClick={discardLocalDraft}>丢弃</button>
            </>
          ) : null}
        </div>
      ) : null}
      {localDraftMessage ? <p className="local-draft-note">{localDraftMessage}</p> : null}
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
          <select
            name="type"
            value={contentType}
            onChange={(event) => {
              setContentType(event.target.value as ContentType);
              markDirtyAndSaveLocalDraft();
            }}
          >
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
        <label>
          可见性
          <select name="visibility" defaultValue={initialValue?.visibility ?? 'public'}>
            <option value="public">公开</option>
            <option value="private">仅自己可见</option>
          </select>
        </label>
      </div>
      <label>
        摘要
        <textarea name="summary" rows={3} defaultValue={initialValue?.summary ?? ''} placeholder="用于列表页、SEO 和 RSS 的短摘要" />
      </label>
      <div className="form-grid">
        <label>
          来源
          <select name="sourceType" defaultValue={initialValue?.sourceType ?? 'original'}>
            <option value="original">原创</option>
            <option value="repost">转载</option>
          </select>
        </label>
        <label>
          原文链接
          <input name="sourceUrl" defaultValue={initialValue?.sourceUrl ?? ''} placeholder="https://example.com/original" />
        </label>
        <label>
          封面资产 ID
          <input name="coverAssetId" defaultValue={initialValue?.coverAssetId ?? ''} placeholder="上传封面后填入资产 ID" />
        </label>
      </div>
      {initialValue?.coverImageUrl ? (
        <a className="cover-preview" href={initialValue.coverImageUrl} target="_blank" rel="noreferrer">
          <img src={initialValue.coverImageUrl} alt={initialValue.coverAltText || initialValue.title || 'Content cover'} />
          <span>查看当前封面</span>
        </a>
      ) : null}
      <div className="form-grid">
        <label>
          分类
          <input name="categories" defaultValue={(initialValue?.categories ?? []).join(', ')} placeholder="Writing, Platform" />
        </label>
        <label>
          标签
          <input name="tags" defaultValue={(initialValue?.tags ?? []).join(', ')} placeholder="Markdown, Next.js" />
        </label>
        <label>
          系列
          <input name="series" defaultValue={(initialValue?.series ?? []).join(', ')} placeholder="Platform Journal" />
        </label>
      </div>
      {contentType === 'project' ? (
        <section className="project-fields" aria-label="项目信息">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Project</p>
              <h2>项目信息</h2>
            </div>
          </div>
          <div className="form-grid">
            <label>
              项目状态
              <select name="projectStatus" defaultValue={initialValue?.project?.status ?? ''}>
                <option value="">未设置</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              技术栈
              <input name="projectStack" defaultValue={(initialValue?.project?.stack ?? []).join(', ')} placeholder="Next.js, PostgreSQL" />
            </label>
            <label>
              开始日期
              <input name="projectStartedAt" type="date" defaultValue={initialValue?.project?.startedAt ?? ''} />
            </label>
            <label>
              结束日期
              <input name="projectEndedAt" type="date" defaultValue={initialValue?.project?.endedAt ?? ''} />
            </label>
            <label>
              Website
              <input name="projectWebsiteUrl" defaultValue={initialValue?.project?.links?.website ?? ''} placeholder="https://example.com" />
            </label>
            <label>
              Repository
              <input name="projectRepositoryUrl" defaultValue={initialValue?.project?.links?.repository ?? ''} placeholder="https://github.com/me/project" />
            </label>
            <label>
              Demo
              <input name="projectDemoUrl" defaultValue={initialValue?.project?.links?.demo ?? ''} placeholder="https://demo.example.com" />
            </label>
            <label>
              Article
              <input name="projectArticleUrl" defaultValue={initialValue?.project?.links?.article ?? ''} placeholder="https://example.com/writeup" />
            </label>
          </div>
        </section>
      ) : null}
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
            onChange={(event) => {
              setMarkdown(event.target.value);
              markDirtyAndSaveLocalDraft();
            }}
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
            {initialValue?.status === 'archived' ? (
              <button type="button" onClick={runDelete} disabled={state === 'submitting'}>
                Delete permanently
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      {message ? <p className={`form-message form-message--${state}`}>{message}</p> : null}
    </form>
  );
}
