import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readGlobalStyles() {
  return ['src/app/styles.css', 'src/app/styles/admin.css', 'src/app/styles/responsive.css']
    .map((path) => readFileSync(join(process.cwd(), path), 'utf8'))
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
      const source = readFileSync(join(process.cwd(), path), 'utf8');

      expect(source, path).toContain('form-message');
      expect(source, path).toContain('role="status"');
      expect(source, path).toContain('aria-live="polite"');
    }
  });

  test('structures markdown transfer as polished operation cards', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminMarkdownTransfer.tsx'), 'utf8');
    const styles = readGlobalStyles();

    expect(source).toContain('admin-transfer-card');
    expect(source).toContain('admin-transfer-actions');
    expect(source).toContain('admin-export-preview');
    expect(source).toContain('admin-import-checklist');
    expect(source).toContain('导入前检查');
    expect(source).toContain('同 slug 内容会被后端拒绝');
    expect(source).toContain('导出结果');
    expect(styles).toContain('.admin-import-checklist');
  });

  test('exposes markdown transfer submitting state accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminMarkdownTransfer.tsx'), 'utf8');

    expect(source).toContain("const transferBusy = state === 'submitting';");
    expect(source).toContain('aria-busy={transferBusy}');
    expect(source).toContain('disabled={transferBusy}');
    expect(source).toContain('aria-disabled={transferBusy}');
  });

  test('keeps taxonomy management dense, localized, and card-like', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/TaxonomyManager.tsx'), 'utf8');

    expect(source).toContain('taxonomy-panel');
    expect(source).toContain('术语管理');
    expect(source).toContain('自动生成，可手动填写');
    expect(source).toContain('readTaxonomyErrorMessage');
    expect(source).toContain('error instanceof Error ? error.message');
    expect(source).toContain("send(buildListTaxonomyTermsRequest(type), '读取列表失败，请确认 API 服务可用。')");
    expect(source).toContain("send(request, '保存失败，请确认已登录且 API 服务可用。')");
    expect(source).toContain("send(buildDeleteTaxonomyTermRequest(type, id), '删除失败，请确认已登录且 API 服务可用。')");
    expect(source).not.toContain('<span>Taxonomy</span>');
    expect(source).not.toContain('leave blank to auto-generate');
  });

  test('exposes taxonomy submitting state accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/TaxonomyManager.tsx'), 'utf8');

    expect(source).toContain("const taxonomyBusy = state === 'submitting';");
    expect(source).toContain('aria-busy={taxonomyBusy}');
    expect(source).toContain('disabled={taxonomyBusy}');
    expect(source).toContain('aria-disabled={taxonomyBusy}');
  });

  test('exposes asset library busy state accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AssetManager.tsx'), 'utf8');

    expect(source).toContain("const assetBusy = state === 'uploading';");
    expect(source).toContain('aria-busy={assetBusy}');
    expect(source).toContain('disabled={assetBusy}');
    expect(source).toContain('aria-disabled={assetBusy}');
  });

  test('exposes study management busy state accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminStudyManager.tsx'), 'utf8');

    expect(source).toContain("const studyBusy = state === 'submitting';");
    expect(source).toContain('aria-busy={studyBusy}');
    expect(source).toContain('disabled={studyBusy}');
    expect(source).toContain('aria-disabled={studyBusy}');
  });

  test('groups site settings into focused sections', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SettingsManager.tsx'), 'utf8');

    expect(source).toContain('settings-section');
    expect(source).toContain('站点身份');
    expect(source).toContain('首页展示');
    expect(source).toContain('导航与入口');
  });

  test('uses structured navigation controls and public identity safety guidance', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SettingsManager.tsx'), 'utf8');
    const styles = readGlobalStyles();

    expect(source).toContain('navigationOptions');
    expect(source).toContain("formData.getAll('navigation')");
    expect(source).toContain('settings-navigation-grid');
    expect(source).toContain('settings-safety-note');
    expect(source).toContain('公开显示名建议保持为 Aster.H');
    expect(source).not.toContain("{ key: 'series', label: '专题'");
    expect(source).not.toContain("{ key: 'guestbook', label: '留言'");
    expect(source).not.toContain("String(formData.get('navigation') ?? '').split(',')");
    expect(styles).toContain('.settings-navigation-grid');
    expect(styles).toContain('.settings-safety-note');
  });

  test('exposes site settings loading and saving state accessibly', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/SettingsManager.tsx'), 'utf8');

    expect(source).toContain('const settingsBusy = state === \'loading\' || state === \'submitting\';');
    expect(source).toContain('aria-busy={settingsBusy}');
    expect(source).toContain('disabled={settingsBusy}');
    expect(source).toContain('aria-disabled={settingsBusy}');
  });

  test('presents login as a polished admin entry surface', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LoginForm.tsx'), 'utf8');
    const styles = readGlobalStyles();

    expect(source).toContain('login-panel__brand');
    expect(source).toContain('login-panel__fields');
    expect(source).toContain('安全入口');
    expect(styles).toContain('.login-panel__brand');
  });

  test('turns the admin home into an operational snapshot for the owner', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/admin/page.tsx'), 'utf8');
    const styles = readGlobalStyles();

    expect(source).toContain('buildAdminOverviewSnapshot');
    expect(source).toContain('运营快照');
    expect(source).toContain('草稿待办');
    expect(source).toContain('热门内容');
    expect(source).toContain('近期变更');
    expect(source).toContain('admin-ops-grid');
    expect(source).toContain('admin-ops-list');
    expect(source).toContain('互动管理');
    expect(source).not.toContain('互动审核');
    expect(styles).toContain('.admin-ops-grid');
    expect(styles).toContain('.admin-ops-card');
    expect(styles).toContain('.admin-ops-list');
  });

  test('gives moderation queues a clear toolbar and empty state', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ModerationManager.tsx'), 'utf8');
    const styles = readGlobalStyles();

    expect(source).toContain('moderation-toolbar-shell');
    expect(source).toContain('moderation-empty-card');
    expect(source).toContain('当前视图');
    expect(styles).toContain('.moderation-empty-card');
  });

  test('connects moderation status filters to the managed list for assistive technology', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ModerationManager.tsx'), 'utf8');

    expect(source).toContain('role="tab"');
    expect(source).toContain('aria-selected={status === option.value}');
    expect(source).toContain('aria-controls="moderation-panel"');
    expect(source).toContain('id={moderationStatusTabId(option.value)}');
    expect(source).toContain('id="moderation-panel"');
    expect(source).toContain('role="tabpanel"');
    expect(source).toContain('aria-busy={state === \'loading\'}');
  });

  test('labels comment and guestbook queues as management now that publishing is direct', () => {
    const commentsPage = readFileSync(join(process.cwd(), 'src/app/admin/comments/page.tsx'), 'utf8');
    const guestbookPage = readFileSync(join(process.cwd(), 'src/app/admin/guestbook/page.tsx'), 'utf8');
    const navigation = readFileSync(join(process.cwd(), 'src/lib/navigation.ts'), 'utf8');
    const manager = readFileSync(join(process.cwd(), 'src/components/ModerationManager.tsx'), 'utf8');

    expect(commentsPage).toContain('<h1>评论管理</h1>');
    expect(guestbookPage).toContain('<h1>留言管理</h1>');
    expect(navigation).toContain("{ href: '/admin/guestbook', label: '留言管理' }");
    expect(manager).toContain("{ label: '待处理', value: 'pending' }");
    expect(manager).toContain("{ label: '已显示', value: 'approved' }");
    expect(manager).toContain("{ label: '已隐藏', value: 'rejected' }");
    expect(manager).toContain("{ label: '垃圾信息', value: 'spam' }");
    expect(manager).toContain("{ label: '显示', value: 'approved' }");
    expect(manager).toContain("{ label: '隐藏', value: 'rejected' }");
    expect(manager).toContain('aria-label="互动状态"');
    expect(`${commentsPage}\n${guestbookPage}\n${navigation}\n${manager}`).not.toContain('评论审核');
    expect(`${commentsPage}\n${guestbookPage}\n${navigation}\n${manager}`).not.toContain('留言审核');
    expect(manager).not.toContain('待审核');
    expect(manager).not.toContain('已通过');
    expect(manager).not.toContain('已拒绝');
    expect(manager).not.toContain('通过');
    expect(manager).not.toContain('拒绝');
    expect(manager).not.toContain('审核状态');
    expect(manager).not.toContain('审核操作失败');
    expect(manager).not.toContain('当前队列');
  });

  test('keeps the mobile admin shell compact before content', () => {
    const styles = readGlobalStyles();

    expect(styles).toMatch(
      /@media \(max-width: 820px\)[\s\S]+\.admin-primary-nav \{[\s\S]+display: flex;[\s\S]+overflow-x: auto;/,
    );
    expect(styles).toMatch(
      /@media \(max-width: 820px\)[\s\S]+\.admin-sidebar__footer \{[\s\S]+grid-template-columns: 1fr;/,
    );
    expect(styles).toMatch(
      /@media \(max-width: 820px\)[\s\S]+\.admin-subnav span \{[\s\S]+display: none;/,
    );
    expect(styles).toMatch(
      /@media \(max-width: 820px\)[\s\S]+\.admin-frontdesk small \{[\s\S]+display: none;/,
    );
  });

  test('keeps the desktop admin sidebar fixed while preserving mobile flow', () => {
    const styles = readGlobalStyles();

    expect(styles).toMatch(/\.admin-sidebar \{[\s\S]+height: 100vh;[\s\S]+overflow-y: auto;[\s\S]+position: sticky;/);
    expect(styles).toMatch(/@media \(max-width: 820px\)[\s\S]+\.admin-sidebar \{[\s\S]+height: auto;[\s\S]+position: static;/);
  });

  test('keeps protected admin shell session status stable when the API session check is unavailable', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminSessionStatus.tsx'), 'utf8');

    expect(source).not.toContain('<span>未登录</span>');
    expect(source).not.toContain('<Link href="/admin/login">登录</Link>');
    expect(source).not.toContain('buildAdminLoginRedirectPath');
    expect(source).not.toContain('正在确认登录状态');
    expect(source).toContain('后台会话');
  });

  test('combines public site shortcuts into one compact frontdesk entry', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminShell.tsx'), 'utf8');

    expect(source).toContain('admin-frontdesk');
    expect(source).toContain('前台入口');
    expect(source).not.toContain('admin-frontdesk__search');
    expect(source).not.toContain('href="/search"');
    expect(source).not.toContain('查看站点');
    expect(source).not.toContain('前台搜索');
  });

  test('separates primary admin navigation, current subgroup, and footer tools', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminShell.tsx'), 'utf8');

    expect(source).toContain('admin-primary-nav');
    expect(source).toContain('admin-subnav');
    expect(source).toContain('admin-sidebar__footer');
    expect(source).toContain('activeChildren');
    expect(source).toContain('activeItem.children ?? []');
    expect(source).not.toContain("filter((child) => child.href !== activeItem.href)");
    expect(source).not.toContain('admin-nav-group');
  });
});
