import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readGlobalStyles() {
  return [
    'src/app/styles/base.css',
    'src/app/styles/public.css',
    'src/app/styles/home.css',
    'src/app/styles/content.css',
    'src/app/styles/leetcode.css',
    'src/app/styles/share.css',
    'src/app/styles/admin.css',
    'src/app/styles/responsive.css',
  ]
    .map((path) => readSource(path))
    .join('\n');
}

describe('admin content form markdown editor', () => {
  test('delegates publish metadata controls to a focused panel component', () => {
    const formSource = readSource('src/components/AdminContentForm.tsx');
    const panelSource = readSource('src/components/AdminPublishSettingsPanel.tsx');

    expect(formSource).toContain("import { AdminPublishSettingsPanel } from './AdminPublishSettingsPanel';");
    expect(formSource).toContain('<AdminPublishSettingsPanel');
    expect(formSource).not.toContain('<section className="publish-settings-panel"');
    expect(panelSource).toContain('export function AdminPublishSettingsPanel');
    expect(panelSource).toContain('className="publish-settings-panel"');
    expect(panelSource).toContain('className="cover-picker"');
  });

  test('renders Markdown formatting controls and enhanced editor stats', () => {
    const source = readSource('src/components/AdminContentForm.tsx');

    expect(source).toContain('markdownToolbarCommands');
    expect(source).toContain('applyMarkdownCommand');
    expect(source).toContain('className="markdown-format-controls"');
    expect(source).toContain('className="editor-stats"');
    expect(source).toContain('editorStats.readingTime');
    expect(source).toContain('undoMarkdownCommand');
    expect(source).toContain('redoMarkdownCommand');
  });

  test('aligns editor and preview panes while rendering real markdown preview html', () => {
    const source = readSource('src/components/AdminContentForm.tsx');
    const styles = readGlobalStyles();

    expect(source).toContain("import { renderMarkdown } from '@starry-summer/markdown';");
    expect(source).toContain('className="editor-pane__header"');
    expect(source).toContain('className="preview-pane__header"');
    expect(source).toContain('className="admin-markdown-preview detail__body"');
    expect(source).toContain('dangerouslySetInnerHTML={{ __html: previewHtml }}');
    expect(styles).toContain('.editor-pane__header,');
    expect(styles).toContain('.preview-pane__header');
    expect(styles).toContain('.admin-markdown-preview');
  });

  test('keeps article creation writing-first and moves metadata into publish settings', () => {
    const source = readSource('src/components/AdminContentForm.tsx');
    const panelSource = readSource('src/components/AdminPublishSettingsPanel.tsx');
    const styles = readGlobalStyles();

    expect(source).toContain('publishSettingsOpen');
    expect(source).toContain('className="writing-workbench"');
    expect(panelSource).toContain('className="publish-settings-panel"');
    expect(source).toContain('setPublishSettingsOpen(true)');
    expect(source).toContain("runSave(formData, 'publish')");
    expect(panelSource).toContain('publish-quality-list');
    expect(styles).toContain('.writing-workbench');
    expect(styles).toContain('.publish-settings-panel');
    expect(styles).toContain('.publish-settings-panel[hidden]');
  });

  test('shows a live publish quality checklist in the publish settings panel', () => {
    const formSource = readSource('src/components/AdminContentForm.tsx');
    const panelSource = readSource('src/components/AdminPublishSettingsPanel.tsx');
    const styles = readGlobalStyles();

    expect(formSource).toContain('const [title, setTitle]');
    expect(formSource).toContain('publishTitle={title}');
    expect(formSource).toContain('bodyWordCount={preview.wordCount}');
    expect(panelSource).toContain("import { buildPublishQualityChecklist } from '@/lib/admin-publish-quality';");
    expect(panelSource).toContain('qualityChecks.map');
    expect(panelSource).toContain('setSummary');
    expect(panelSource).toContain('setSeoDescription');
    expect(styles).toContain('.publish-quality-list');
    expect(styles).toContain('.publish-quality-item--warning');
    expect(styles).toContain('.publish-quality-item--ok');
  });

  test('announces local draft, asset, and remote save feedback accessibly', () => {
    const source = readSource('src/components/AdminContentForm.tsx');

    expect(source).toContain('localDraftMessage');
    expect(source).toContain('assetMessage');
    expect(source).toContain('className="local-draft-note"');
    expect(source).toContain('className={`asset-insert-message asset-insert-message--${assetState}`} role="status" aria-live="polite"');
    expect(source).toContain('className={`form-message form-message--${state}`} role="status" aria-live="polite"');
  });

  test('blocks remote content saves in static-site mode', () => {
    const source = readSource('src/components/AdminContentForm.tsx');

    expect(source).toContain('STATIC_REPOSITORY_WRITE_MESSAGE');
    expect(source).not.toContain('buildRepositoryContentPublishRequest');
    expect(source).not.toContain('fetch(request.url');
    expect(source).not.toContain('NEXT_PUBLIC_CONTENT_WRITE_TARGET');
    expect(source).not.toContain('buildCreateDraftRequest');
    expect(source).not.toContain('buildUpdateContentRequest');
    expect(source).not.toContain('buildAdminContentActionRequest');
    expect(source).not.toContain('buildSetContentVisibilityRequest');
  });

  test('blocks old database deletes completely', () => {
    const source = readSource('src/components/AdminContentForm.tsx');

    expect(source).toContain('仓库模式下不会执行数据库删除');
    expect(source).not.toContain('buildDeleteContentRequest');
    expect(source).not.toContain("method: 'DELETE'");
  });

  test('keeps all public content types available in publish settings', () => {
    const source = readSource('src/components/AdminPublishSettingsPanel.tsx');

    expect(source).toContain('<option value="post">');
    expect(source).toContain('<option value="note">');
    expect(source).toContain('<option value="moment">');
    expect(source).toContain('<option value="project">');
  });

  test('describes the lightweight paste and drag image flow in the editor', () => {
    const source = readSource('src/components/AdminContentForm.tsx');

    expect(source).toContain('可以先粘贴或拖拽图片到正文');
    expect(source).toContain('图片提交到 apps/web/public/images');
  });
});
