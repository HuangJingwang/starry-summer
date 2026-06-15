'use client';

import { renderMarkdown } from '@starry-summer/markdown';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectMetadata } from '@starry-summer/shared';

import {
  buildAdminAssetListRequest,
  insertMarkdownAsset,
  normalizeStoredAsset,
  type AssetUsage,
  type StoredAsset,
} from '@/lib/assets';
import {
  buildContentPayloadFromFormData,
  buildRepositoryContentPublishRequest,
  createMarkdownPreview,
  getContentDraftStorageKey,
  getUnsavedContentWarning,
  parseContentDraftSnapshot,
  readAdminContentErrorMessage,
  serializeContentDraftSnapshot,
  type ContentDraftSnapshot,
} from '@/lib/admin-content';
import {
  applyMarkdownCommand,
  createMarkdownEditorStats,
  type MarkdownEditorCommand,
} from '@/lib/markdown-editor';
import { AdminPublishSettingsPanel } from './AdminPublishSettingsPanel';

interface AdminContentFormInitialValue {
  id?: string;
  title?: string;
  slug?: string;
  type?: ContentType;
  status?: ContentStatus;
  visibility?: ContentVisibility;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
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
type AssetLoadState = 'idle' | 'loading' | 'ready' | 'error';

const fallbackMarkdown = '# 新内容标题\n\n这里写正文。';
const authoringAssetUsages: AssetUsage[] = ['content', 'attachment', 'cover'];
const markdownToolbarCommands: Array<{ command: MarkdownEditorCommand; label: string; icon: string }> = [
  { command: 'heading', label: '标题', icon: 'H' },
  { command: 'bold', label: '加粗', icon: 'B' },
  { command: 'italic', label: '斜体', icon: 'I' },
  { command: 'link', label: '链接', icon: '->' },
  { command: 'quote', label: '引用', icon: '>' },
  { command: 'unordered-list', label: '无序列表', icon: '-' },
  { command: 'ordered-list', label: '有序列表', icon: '1.' },
  { command: 'code-block', label: '代码', icon: '</>' },
  { command: 'divider', label: '分割线', icon: '---' },
];

export function AdminContentForm({ mode, initialValue }: AdminContentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [markdown, setMarkdown] = useState(initialValue?.bodyMarkdown ?? fallbackMarkdown);
  const [contentType, setContentType] = useState<ContentType>(initialValue?.type ?? 'post');
  const [isDirty, setIsDirty] = useState(false);
  const [localDraft, setLocalDraft] = useState<ContentDraftSnapshot | null>(null);
  const [localDraftMessage, setLocalDraftMessage] = useState('');
  const [assetState, setAssetState] = useState<AssetLoadState>('idle');
  const [assetMessage, setAssetMessage] = useState('');
  const [authoringAssets, setAuthoringAssets] = useState<StoredAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedCoverAssetId, setSelectedCoverAssetId] = useState(initialValue?.coverAssetId ?? '');
  const [coverAssetId, setCoverAssetId] = useState(initialValue?.coverAssetId ?? '');
  const [previewHtml, setPreviewHtml] = useState('');
  const [publishSettingsOpen, setPublishSettingsOpen] = useState(mode === 'edit');
  const preview = useMemo(() => createMarkdownPreview(markdown), [markdown]);
  const editorStats = useMemo(() => createMarkdownEditorStats(markdown), [markdown]);
  const coverAssets = useMemo(
    () => authoringAssets.filter((asset) => asset.usage === 'cover' && asset.mimeType.startsWith('image/')),
    [authoringAssets],
  );
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

  useEffect(() => {
    let cancelled = false;

    async function loadAuthoringAssets() {
      setAssetState('loading');
      setAssetMessage('');

      try {
        const responses = await Promise.all(
          authoringAssetUsages.map((usage) => {
            const request = buildAdminAssetListRequest({ usage });

            if (!request) {
              return Promise.resolve(new Response(JSON.stringify([])));
            }

            return fetch(request.url, request.init);
          }),
        );

        if (responses.some((response) => !response.ok)) {
          throw new Error('Asset list request failed');
        }

        const lists = await Promise.all(responses.map((response) => response.json()));
        const assets = dedupeAssets(
          lists.flatMap((list) => (Array.isArray(list) ? list.map((item) => normalizeStoredAsset(item as Partial<StoredAsset>)) : [])),
        );

        if (cancelled) {
          return;
        }

        setAuthoringAssets(assets);
        setSelectedAssetId((current) => current || assets[0]?.id || '');
        setSelectedCoverAssetId((current) => current || assets.find((asset) => asset.usage === 'cover' && asset.mimeType.startsWith('image/'))?.id || '');
        setAssetState('ready');
      } catch {
        if (!cancelled) {
          setAssetState('error');
          setAssetMessage('素材列表加载失败，可先到素材管理页面上传或稍后重试。');
        }
      }
    }

    void loadAuthoringAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void renderMarkdown(markdown)
      .then((html) => {
        if (active) {
          setPreviewHtml(html);
        }
      })
      .catch(() => {
        if (active) {
          setPreviewHtml('<p>预览生成失败，请检查 Markdown 内容。</p>');
        }
      });

    return () => {
      active = false;
    };
  }, [markdown]);

  function readDraftSnapshot(bodyMarkdownOverride?: string): ContentDraftSnapshot | null {
    if (!formRef.current) {
      return null;
    }

    const formData = new FormData(formRef.current);
    const visibility = formData.get('visibility') === 'private' ? 'private' : 'public';

    return {
      title: String(formData.get('title') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      summary: String(formData.get('summary') ?? ''),
      seoTitle: String(formData.get('seoTitle') ?? ''),
      seoDescription: String(formData.get('seoDescription') ?? ''),
      visibility,
      bodyMarkdown: bodyMarkdownOverride ?? String(formData.get('bodyMarkdown') ?? markdown),
      savedAt: new Date().toISOString(),
    };
  }

  function saveLocalDraft(bodyMarkdownOverride?: string) {
    const snapshot = readDraftSnapshot(bodyMarkdownOverride);

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

  function markDirtyAndSaveMarkdownDraft(nextMarkdown: string) {
    setIsDirty(true);
    saveLocalDraft(nextMarkdown);
  }

  function setMarkdownFromEditor(nextMarkdown: string, selectionStart?: number, selectionEnd?: number) {
    setMarkdown(nextMarkdown);
    markDirtyAndSaveMarkdownDraft(nextMarkdown);

    window.requestAnimationFrame(() => {
      markdownTextareaRef.current?.focus();

      if (selectionStart !== undefined && selectionEnd !== undefined) {
        markdownTextareaRef.current?.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  }

  function runMarkdownCommand(command: MarkdownEditorCommand) {
    const textarea = markdownTextareaRef.current;
    const result = applyMarkdownCommand(
      markdown,
      {
        start: textarea?.selectionStart ?? markdown.length,
        end: textarea?.selectionEnd ?? markdown.length,
      },
      command,
    );

    undoStackRef.current.push(markdown);
    redoStackRef.current = [];
    setMarkdownFromEditor(result.markdown, result.selectionStart, result.selectionEnd);
  }

  function undoMarkdownCommand() {
    const previousMarkdown = undoStackRef.current.pop();

    if (previousMarkdown === undefined) {
      return;
    }

    redoStackRef.current.push(markdown);
    setMarkdownFromEditor(previousMarkdown);
  }

  function redoMarkdownCommand() {
    const nextMarkdown = redoStackRef.current.pop();

    if (nextMarkdown === undefined) {
      return;
    }

    undoStackRef.current.push(markdown);
    setMarkdownFromEditor(nextMarkdown);
  }

  function recoverLocalDraft() {
    if (!localDraft || !formRef.current) {
      return;
    }

    const controls = formRef.current.elements as HTMLFormControlsCollection & {
      title?: HTMLInputElement;
      slug?: HTMLInputElement;
      summary?: HTMLTextAreaElement;
      seoTitle?: HTMLInputElement;
      seoDescription?: HTMLTextAreaElement;
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

    if (controls.seoTitle) {
      controls.seoTitle.value = localDraft.seoTitle ?? '';
    }

    if (controls.seoDescription) {
      controls.seoDescription.value = localDraft.seoDescription ?? '';
    }

    if (controls.visibility) {
      controls.visibility.value = localDraft.visibility;
    }

    setMarkdown(localDraft.bodyMarkdown);
    setTitle(localDraft.title);
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
      throw new Error(await readAdminContentErrorMessage(response, `请求失败，服务器返回 ${response.status}。`));
    }

    return response.json().catch(() => null);
  }

  async function saveToRepository(formData: FormData, lifecycle?: 'publish' | 'archive' | 'restore-draft'): Promise<string | undefined> {
    ensureDraftSlug(formData);
    const payload = buildContentPayloadFromFormData(formData);
    const result = await send(buildRepositoryContentPublishRequest(payload, {
      contentId: initialValue?.id,
      action: lifecycle === 'restore-draft' ? 'restore-draft' : lifecycle ?? 'save',
    }));

    return typeof result?.id === 'string' ? result.id : initialValue?.id;
  }

  async function runSave(formData: FormData, lifecycle?: 'publish' | 'archive' | 'restore-draft') {
    setState('submitting');
    setMessage('');

    try {
      await saveToRepository(formData, lifecycle);
      clearSuccessfulSaveState(lifecycle);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '保存失败，请确认已登录且仓库发布服务可用。');
    }
  }

  function clearSuccessfulSaveState(lifecycle?: 'publish' | 'archive' | 'restore-draft') {
    try {
      window.localStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore localStorage cleanup errors after a successful remote save.
    }

    setLocalDraft(null);
    setLocalDraftMessage('');
    setIsDirty(false);
    setState('success');
    setMessage(getSaveSuccessMessage(lifecycle));
  }

  function getSaveSuccessMessage(lifecycle?: 'publish' | 'archive' | 'restore-draft') {
    if (lifecycle === 'publish') {
      return '已保存并发布。';
    }

    if (lifecycle === 'archive') {
      return '已归档。';
    }

    if (lifecycle === 'restore-draft') {
      return '已恢复为草稿。';
    }

    return '已保存草稿。';
  }

  function ensureDraftSlug(formData: FormData) {
    const slug = String(formData.get('slug') ?? '').trim();
    const title = String(formData.get('title') ?? '').trim();

    if (!slug && title) {
      formData.set('slug', title);
    }
  }

  async function runDelete() {
    if (!initialValue?.id || !window.confirm('确认永久删除这篇已归档内容吗？')) {
      return;
    }

    setState('error');
    setMessage('仓库模式下不会执行数据库删除，请通过仓库内容文件删除并提交。');
  }

  function insertSelectedAsset() {
    const selectedAsset = authoringAssets.find((asset) => asset.id === selectedAssetId);

    if (!selectedAsset) {
      setAssetMessage('请选择一个素材。');
      return;
    }

    const textarea = markdownTextareaRef.current;
    const insertion = insertMarkdownAsset(markdown, selectedAsset, {
      start: textarea?.selectionStart ?? markdown.length,
      end: textarea?.selectionEnd ?? markdown.length,
    });

    setMarkdown(insertion.markdown);
    markDirtyAndSaveMarkdownDraft(insertion.markdown);
    setAssetMessage('素材已插入 Markdown。');

    window.requestAnimationFrame(() => {
      markdownTextareaRef.current?.focus();
      markdownTextareaRef.current?.setSelectionRange(insertion.selectionStart, insertion.selectionEnd);
    });
  }

  function applySelectedCoverAsset() {
    if (!selectedCoverAssetId) {
      setAssetMessage('请选择一个封面素材。');
      return;
    }

    const selectedCover = coverAssets.find((asset) => asset.id === selectedCoverAssetId);

    if (!selectedCover) {
      setAssetMessage('选择的封面素材不可用，请刷新素材列表。');
      return;
    }

    setCoverAssetId(selectedCover.id);
    setIsDirty(true);
    window.requestAnimationFrame(() => saveLocalDraft());
    setAssetMessage('已设置为内容封面。');
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
      {localDraftMessage ? <p className="local-draft-note" role="status" aria-live="polite">{localDraftMessage}</p> : null}
      <section className="writing-workbench" aria-label="文章写作区">
        <label className="writing-title-field">
          标题
          <input
            name="title"
            defaultValue={initialValue?.title ?? ''}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：一次系统重构记录"
            required
          />
        </label>
        <div className="editor-grid">
          <section className="editor-pane">
            <div className="editor-pane__header">
              <div>
                <label htmlFor="markdown-body">Markdown</label>
                <span>正文编辑</span>
              </div>
              <div className="editor-toolbar">
                <div className="markdown-format-controls" aria-label="Markdown 格式工具">
                  <button type="button" onClick={undoMarkdownCommand} title="撤销" aria-label="撤销">
                    撤销
                  </button>
                  <button type="button" onClick={redoMarkdownCommand} title="重做" aria-label="重做">
                    重做
                  </button>
                  {markdownToolbarCommands.map((item) => (
                    <button
                      key={item.command}
                      type="button"
                      onClick={() => runMarkdownCommand(item.command)}
                      title={item.label}
                      aria-label={item.label}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
                <div className="asset-insert-controls">
                  <select
                    value={selectedAssetId}
                    onChange={(event) => setSelectedAssetId(event.target.value)}
                    aria-label="选择要插入的素材"
                    disabled={assetState === 'loading' || authoringAssets.length === 0}
                  >
                    {authoringAssets.length > 0 ? (
                      authoringAssets.map((asset) => (
                        <option key={asset.id || asset.storageKey} value={asset.id}>
                          {formatAssetOptionLabel(asset)}
                        </option>
                      ))
                    ) : (
                      <option value="">{assetState === 'loading' ? '加载素材中' : '暂无可插入素材'}</option>
                    )}
                  </select>
                  <button type="button" onClick={insertSelectedAsset} disabled={assetState === 'loading' || authoringAssets.length === 0}>
                    插入素材
                  </button>
                </div>
              </div>
              {assetMessage ? (
                <p className={`asset-insert-message asset-insert-message--${assetState}`} role="status" aria-live="polite">
                  {assetMessage}
                </p>
              ) : null}
            </div>
            <textarea
              ref={markdownTextareaRef}
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
            <div className="preview-pane__header">
              <div>
                <p className="eyebrow">预览</p>
                <h2>{preview.title}</h2>
                <p>{preview.excerpt}</p>
              </div>
            </div>
            <div className="admin-markdown-preview detail__body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            <dl className="editor-stats">
              <div>
                <dt>瀛楁暟</dt>
                <dd>{preview.wordCount}</dd>
              </div>
              <div>
                <dt>琛屾暟</dt>
                <dd>{editorStats.lineCount}</dd>
              </div>
              <div>
                <dt>瀛楃</dt>
                <dd>{editorStats.characterCount}</dd>
              </div>
              <div>
                <dt>闃呰</dt>
                <dd>{editorStats.readingTime}</dd>
              </div>
            </dl>
          </section>
        </div>
      </section>
      <AdminPublishSettingsPanel
        isOpen={publishSettingsOpen}
        initialValue={initialValue}
        contentType={contentType}
        publishTitle={title}
        bodyWordCount={preview.wordCount}
        onContentTypeChange={(nextContentType) => {
          setContentType(nextContentType);
          markDirtyAndSaveLocalDraft();
        }}
        onClose={() => setPublishSettingsOpen(false)}
        coverAssetId={coverAssetId}
        onCoverAssetIdChange={(nextCoverAssetId) => {
          setCoverAssetId(nextCoverAssetId);
          setIsDirty(true);
          window.requestAnimationFrame(() => saveLocalDraft());
        }}
        selectedCoverAssetId={selectedCoverAssetId}
        onSelectedCoverAssetIdChange={setSelectedCoverAssetId}
        coverAssets={coverAssets}
        assetState={assetState}
        onApplySelectedCoverAsset={applySelectedCoverAsset}
        saveState={state}
        onPublish={(formData) => runSave(formData, 'publish')}
      />
      <div className="admin-actions">
        <button type="submit" disabled={state === 'submitting'}>
          {state === 'submitting' ? '保存中' : '保存草稿'}
        </button>
        <button type="button" onClick={() => setPublishSettingsOpen(true)} disabled={state === 'submitting'}>
          打开发布设置
        </button>
        {mode === 'edit' ? (
          <>
            <button type="submit" formAction={(formData) => runSave(formData, 'archive')} disabled={state === 'submitting'}>
              归档
            </button>
            <button type="submit" formAction={(formData) => runSave(formData, 'restore-draft')} disabled={state === 'submitting'}>
              恢复为草稿
            </button>
            {initialValue?.status === 'archived' ? (
              <button type="button" onClick={runDelete} disabled={state === 'submitting'}>
                永久删除
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      {message ? <p className={`form-message form-message--${state}`} role="status" aria-live="polite">{message}</p> : null}
    </form>
  );
}

function dedupeAssets(assets: StoredAsset[]): StoredAsset[] {
  const seen = new Set<string>();
  const result: StoredAsset[] = [];

  for (const asset of assets) {
    const key = asset.id || asset.storageKey;

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(asset);
  }

  return result;
}

function formatAssetOptionLabel(asset: StoredAsset): string {
  const label = asset.altText || asset.storageKey.split('/').filter(Boolean).at(-1) || asset.publicUrl;

  return `${label} 路 ${asset.usage}`;
}
