import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readGlobalStyles() {
  return ['src/app/styles.css', 'src/app/styles/admin.css', 'src/app/styles/responsive.css']
    .map((path) => readFileSync(join(process.cwd(), path), 'utf8'))
    .join('\n');
}

describe('admin content form markdown editor', () => {
  test('delegates publish metadata controls to a focused panel component', () => {
    const formSource = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');
    const panelSource = readFileSync(join(process.cwd(), 'src/components/AdminPublishSettingsPanel.tsx'), 'utf8');

    expect(formSource).toContain("import { AdminPublishSettingsPanel } from './AdminPublishSettingsPanel';");
    expect(formSource).toContain('<AdminPublishSettingsPanel');
    expect(formSource).not.toContain('<section className="publish-settings-panel"');
    expect(panelSource).toContain('export function AdminPublishSettingsPanel');
    expect(panelSource).toContain('className="publish-settings-panel"');
    expect(panelSource).toContain('className="cover-picker"');
    expect(panelSource).toContain('aria-label="项目信息"');
  });

  test('renders Markdown formatting controls and enhanced editor stats', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');

    expect(source).toContain('markdownToolbarCommands');
    expect(source).toContain('applyMarkdownCommand');
    expect(source).toContain('className="markdown-format-controls"');
    expect(source).toContain('aria-label="Markdown 格式工具"');
    expect(source).toContain('className="editor-stats"');
    expect(source).toContain('editorStats.readingTime');
  });

  test('aligns editor and preview panes while rendering real markdown preview html', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');
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
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');
    const panelSource = readFileSync(join(process.cwd(), 'src/components/AdminPublishSettingsPanel.tsx'), 'utf8');
    const styles = readGlobalStyles();

    expect(source).toContain('publishSettingsOpen');
    expect(source).toContain('className="writing-workbench"');
    expect(panelSource).toContain('className="publish-settings-panel"');
    expect(source).toContain('打开发布设置');
    expect(source).toContain("setPublishSettingsOpen(true)");
    expect(source).toContain("runSave(formData, 'publish')");
    expect(panelSource).toContain('发布前检查');
    expect(styles).toContain('.writing-workbench');
    expect(styles).toContain('.publish-settings-panel');
    expect(styles).toContain('.publish-settings-panel[hidden]');
  });

  test('shows a live publish quality checklist in the publish settings panel', () => {
    const formSource = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');
    const panelSource = readFileSync(join(process.cwd(), 'src/components/AdminPublishSettingsPanel.tsx'), 'utf8');
    const styles = readGlobalStyles();

    expect(formSource).toContain('const [title, setTitle]');
    expect(formSource).toContain('publishTitle={title}');
    expect(formSource).toContain('bodyWordCount={preview.wordCount}');
    expect(panelSource).toContain("import { buildPublishQualityChecklist } from '@/lib/admin-publish-quality';");
    expect(panelSource).toContain('publish-quality-list');
    expect(panelSource).toContain('qualityChecks.map');
    expect(panelSource).toContain('setSummary');
    expect(panelSource).toContain('setSeoDescription');
    expect(styles).toContain('.publish-quality-list');
    expect(styles).toContain('.publish-quality-item--warning');
    expect(styles).toContain('.publish-quality-item--ok');
  });

  test('announces local draft save and recovery feedback accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');

    expect(source).toContain('localDraftMessage');
    expect(source).toContain('本地草稿已保存');
    expect(source).toContain('已恢复本地草稿');
    expect(source).toContain('className="local-draft-note"');
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
  });

  test('announces asset insertion and cover feedback accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');

    expect(source).toContain('assetMessage');
    expect(source).toContain('素材已插入 Markdown。');
    expect(source).toContain('已设置为内容封面。');
    expect(source).toContain('className={`asset-insert-message asset-insert-message--${assetState}`} role="status" aria-live="polite"');
  });

  test('announces remote content save and lifecycle feedback accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentForm.tsx'), 'utf8');

    expect(source).toContain('已保存草稿。');
    expect(source).toContain('已保存并发布。');
    expect(source).toContain('已永久删除。');
    expect(source).toContain('className={`form-message form-message--${state}`} role="status" aria-live="polite"');
  });

  test('creates article content without a separate note type option', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminPublishSettingsPanel.tsx'), 'utf8');

    expect(source).toContain('<option value="post">文章</option>');
    expect(source).not.toContain('<option value="note">笔记</option>');
  });
});
