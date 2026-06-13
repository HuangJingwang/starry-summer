'use client';

import { useMemo, useState } from 'react';
import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectMetadata } from '@starry-summer/shared';

import type { StoredAsset } from '@/lib/assets';
import { buildPublishQualityChecklist } from '@/lib/admin-publish-quality';

type SaveState = 'idle' | 'submitting' | 'success' | 'error';
type AssetLoadState = 'idle' | 'loading' | 'ready' | 'error';

interface AdminPublishSettingsInitialValue {
  title?: string;
  slug?: string;
  type?: ContentType;
  status?: ContentStatus;
  visibility?: ContentVisibility;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
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

interface AdminPublishSettingsPanelProps {
  isOpen: boolean;
  initialValue?: AdminPublishSettingsInitialValue;
  contentType: ContentType;
  publishTitle: string;
  bodyWordCount: number;
  onContentTypeChange: (contentType: ContentType) => void;
  onClose: () => void;
  coverAssetId: string;
  onCoverAssetIdChange: (coverAssetId: string) => void;
  selectedCoverAssetId: string;
  onSelectedCoverAssetIdChange: (assetId: string) => void;
  coverAssets: StoredAsset[];
  assetState: AssetLoadState;
  onApplySelectedCoverAsset: () => void;
  saveState: SaveState;
  onPublish: (formData: FormData) => void | Promise<void>;
}

export function AdminPublishSettingsPanel({
  isOpen,
  initialValue,
  contentType,
  publishTitle,
  bodyWordCount,
  onContentTypeChange,
  onClose,
  coverAssetId,
  onCoverAssetIdChange,
  selectedCoverAssetId,
  onSelectedCoverAssetIdChange,
  coverAssets,
  assetState,
  onApplySelectedCoverAsset,
  saveState,
  onPublish,
}: AdminPublishSettingsPanelProps) {
  const [summary, setSummary] = useState(initialValue?.summary ?? '');
  const [seoDescription, setSeoDescription] = useState(initialValue?.seoDescription ?? '');
  const qualityChecks = useMemo(
    () =>
      buildPublishQualityChecklist({
        contentType,
        title: publishTitle,
        summary,
        seoDescription,
        bodyWordCount,
        coverAssetId,
      }),
    [bodyWordCount, contentType, coverAssetId, publishTitle, seoDescription, summary],
  );

  return (
    <section className="publish-settings-panel" hidden={!isOpen} aria-label="发布设置">
      <div className="publish-settings-panel__header">
        <div>
          <p className="eyebrow">发布前检查</p>
          <h2>封面、说明与分类</h2>
        </div>
        <button type="button" onClick={onClose}>
          收起
        </button>
      </div>
      <ul className="publish-quality-list" aria-label="发布质量检查">
        {qualityChecks.map((check) => (
          <li key={check.label} className={`publish-quality-item publish-quality-item--${check.status}`}>
            <strong>{check.label}</strong>
            <span>{check.status === 'ok' ? '通过' : '提醒'}</span>
            <small>{check.detail}</small>
          </li>
        ))}
      </ul>
      <div className="form-grid">
        <label>
          Slug
          <input name="slug" defaultValue={initialValue?.slug ?? ''} placeholder="system-refactor-notes" />
        </label>
        <label>
          类型
          <select
            name="type"
            value={contentType}
            onChange={(event) => {
              onContentTypeChange(event.target.value as ContentType);
            }}
          >
            <option value="post">文章</option>
            <option value="moment">日常</option>
            <option value="project">项目</option>
            <option value="page">页面</option>
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
        <textarea
          name="summary"
          rows={3}
          defaultValue={initialValue?.summary ?? ''}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="用于列表页、SEO 和 RSS 的短摘要"
        />
      </label>
      <div className="form-grid">
        <label>
          SEO 标题
          <input name="seoTitle" defaultValue={initialValue?.seoTitle ?? ''} placeholder="留空则使用内容标题" />
        </label>
        <label>
          SEO 描述
          <textarea
            name="seoDescription"
            rows={2}
            defaultValue={initialValue?.seoDescription ?? ''}
            onChange={(event) => setSeoDescription(event.target.value)}
            placeholder="留空则使用摘要或站点描述"
          />
        </label>
      </div>
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
          <input
            name="coverAssetId"
            value={coverAssetId}
            onChange={(event) => onCoverAssetIdChange(event.target.value)}
            placeholder="上传封面后填入资产 ID"
          />
        </label>
      </div>
      <div className="cover-picker">
        <label>
          从封面素材选择
          <select
            value={selectedCoverAssetId}
            onChange={(event) => onSelectedCoverAssetIdChange(event.target.value)}
            disabled={assetState === 'loading' || coverAssets.length === 0}
          >
            {coverAssets.length > 0 ? (
              coverAssets.map((asset) => (
                <option key={asset.id || asset.storageKey} value={asset.id}>
                  {formatAssetOptionLabel(asset)}
                </option>
              ))
            ) : (
              <option value="">{assetState === 'loading' ? '加载封面素材中' : '暂无封面素材'}</option>
            )}
          </select>
        </label>
        <button type="button" onClick={onApplySelectedCoverAsset} disabled={assetState === 'loading' || coverAssets.length === 0}>
          设为封面
        </button>
      </div>
      {initialValue?.coverImageUrl ? (
        <a className="cover-preview" href={initialValue.coverImageUrl} target="_blank" rel="noreferrer">
          <img src={initialValue.coverImageUrl} alt={initialValue.coverAltText || initialValue.title || '内容封面'} />
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
      {contentType === 'project' ? <ProjectMetadataFields project={initialValue?.project} /> : null}
      <div className="form-options">
        <label>
          <input name="allowComments" type="checkbox" defaultChecked={initialValue?.allowComments ?? true} />
          允许评论
        </label>
        <label>
          <input name="featured" type="checkbox" defaultChecked={initialValue?.featured ?? false} />
          首页精选
        </label>
        <label>
          <input name="pinned" type="checkbox" defaultChecked={initialValue?.pinned ?? false} />
          置顶
        </label>
      </div>
      <div className="publish-settings-panel__actions">
        <button type="submit" formAction={onPublish} disabled={saveState === 'submitting'}>
          {saveState === 'submitting' ? '发布中' : '确认发布'}
        </button>
      </div>
    </section>
  );
}

function ProjectMetadataFields({ project }: { project?: ProjectMetadata }) {
  return (
    <section className="project-fields" aria-label="项目信息">
      <div className="section-heading section-heading--row">
        <div>
          <p className="eyebrow">项目</p>
          <h2>项目信息</h2>
        </div>
      </div>
      <div className="form-grid">
        <label>
          项目状态
          <select name="projectStatus" defaultValue={project?.status ?? ''}>
            <option value="">未设置</option>
            <option value="active">进行中</option>
            <option value="paused">暂停</option>
            <option value="completed">已完成</option>
            <option value="archived">已归档</option>
          </select>
        </label>
        <label>
          技术栈
          <input name="projectStack" defaultValue={(project?.stack ?? []).join(', ')} placeholder="Next.js, PostgreSQL" />
        </label>
        <label>
          开始日期
          <input name="projectStartedAt" type="date" defaultValue={project?.startedAt ?? ''} />
        </label>
        <label>
          结束日期
          <input name="projectEndedAt" type="date" defaultValue={project?.endedAt ?? ''} />
        </label>
        <label>
          官网
          <input name="projectWebsiteUrl" defaultValue={project?.links?.website ?? ''} placeholder="https://example.com" />
        </label>
        <label>
          代码仓库
          <input name="projectRepositoryUrl" defaultValue={project?.links?.repository ?? ''} placeholder="https://github.com/me/project" />
        </label>
        <label>
          演示地址
          <input name="projectDemoUrl" defaultValue={project?.links?.demo ?? ''} placeholder="https://demo.example.com" />
        </label>
        <label>
          相关文章
          <input name="projectArticleUrl" defaultValue={project?.links?.article ?? ''} placeholder="https://example.com/writeup" />
        </label>
      </div>
    </section>
  );
}

function formatAssetOptionLabel(asset: StoredAsset): string {
  const label = asset.altText || asset.storageKey.split('/').filter(Boolean).at(-1) || asset.publicUrl;

  return `${label} · ${asset.usage}`;
}
