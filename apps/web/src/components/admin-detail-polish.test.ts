import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readGlobalStyles() {
  return ['src/app/styles.css', 'src/app/styles/admin.css', 'src/app/styles/responsive.css']
    .map((path) => readSource(path))
    .join('\n');
}

describe('admin detail polish', () => {
  test('announces admin operation feedback accessibly', () => {
    const messageComponents = [
      'src/components/AdminContentForm.tsx',
      'src/components/AdminContentTable.tsx',
      'src/components/AdminMarkdownTransfer.tsx',
      'src/components/AdminStudyManager.tsx',
      'src/components/AssetManager.tsx',
      'src/components/LoginForm.tsx',
      'src/components/ModerationManager.tsx',
      'src/components/SettingsManager.tsx',
      'src/components/TaxonomyManager.tsx',
    ];

    for (const path of messageComponents) {
      const source = readSource(path);

      expect(source, path).toContain('form-message');
      expect(source, path).toContain('role="status"');
      expect(source, path).toContain('aria-live="polite"');
    }
  });

  test('keeps taxonomy management dense, localized, and repository-aware', () => {
    const source = readSource('src/components/TaxonomyManager.tsx');
    const pageSource = readSource('src/app/admin/taxonomy/page.tsx');

    expect(source).toContain('taxonomy-panel');
    expect(source).toContain('术语管理');
    expect(source).toContain('自动生成，可手动填写');
    expect(source).toContain('readTaxonomyErrorMessage');
    expect(source).toContain('error instanceof Error ? error.message');
    expect(source).toContain("send(buildListTaxonomyTermsRequest(type), '读取列表失败，请确认 API 服务可用。')");
    expect(source).toContain("send(request, '保存失败，请确认已登录且 API 服务可用。')");
    expect(source).toContain("send(buildDeleteTaxonomyTermRequest(type, id), '删除失败，请确认已登录且 API 服务可用。')");
    expect(source).toContain('仓库模式：这里展示从内容元数据派生出的术语，不再写入数据库表。');
    expect(source).toContain('repositoryMode ? null : (');
    expect(pageSource).toContain('buildTaxonomyTermsFromContent(await loadSiteContent())');
    expect(pageSource).toContain('<TaxonomyManager initialTerms={initialTerms} repositoryMode />');
    expect(pageSource).not.toContain('NEXT_PUBLIC_CONTENT_WRITE_TARGET');
    expect(source).not.toContain('<span>Taxonomy</span>');
    expect(source).not.toContain('leave blank to auto-generate');
  });

  test('exposes admin submitting and loading states accessibly', () => {
    const checks: Array<[string, string, string?]> = [
      ['src/components/AdminMarkdownTransfer.tsx', 'transferBusy'],
      ['src/components/TaxonomyManager.tsx', 'taxonomyBusy'],
      ['src/components/AssetManager.tsx', 'assetBusy'],
      ['src/components/AdminStudyManager.tsx', 'studyBusy', 'actionDisabled'],
      ['src/components/SettingsManager.tsx', 'settingsBusy'],
    ];

    for (const [path, busyName, disabledName = busyName] of checks) {
      const source = readSource(path);

      expect(source, path).toContain(busyName);
      expect(source, path).toContain(`aria-busy={${busyName}}`);
      expect(source, path).toContain(`disabled={${disabledName}}`);
      expect(source, path).toContain(`aria-disabled={${disabledName}}`);
    }
  });

  test('keeps major admin surfaces structured with existing classes', () => {
    const styles = readGlobalStyles();

    expect(readSource('src/components/AdminMarkdownTransfer.tsx')).toContain('admin-transfer-card');
    expect(readSource('src/components/ModerationManager.tsx')).toContain('moderation-toolbar-shell');
    expect(readSource('src/components/SettingsManager.tsx')).toContain('settings-navigation-grid');
    expect(readSource('src/components/LoginForm.tsx')).toContain('login-panel__brand');
    expect(readSource('src/app/admin/page.tsx')).toContain('admin-ops-grid');
    expect(readSource('src/components/AdminShell.tsx')).toContain('admin-primary-nav');
    expect(styles).toContain('.admin-ops-grid');
    expect(styles).toContain('.settings-navigation-grid');
    expect(styles).toMatch(/\.admin-sidebar \{[\s\S]+position: sticky;/);
    expect(styles).toMatch(/@media \(max-width: 820px\)[\s\S]+\.admin-sidebar \{[\s\S]+position: static;/);
  });
});
