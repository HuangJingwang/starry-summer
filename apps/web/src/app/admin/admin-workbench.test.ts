import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readAdminPageSource() {
  return readFileSync(join(process.cwd(), 'src/app/admin/page.tsx'), 'utf8');
}

function readAdminSettingsPageSource() {
  return readFileSync(join(process.cwd(), 'src/app/admin/settings/page.tsx'), 'utf8');
}

describe('admin writing workbench', () => {
  test('centers the admin landing page on daily writing workflows', () => {
    const source = readAdminPageSource();

    expect(source).toContain('写作工作台');
    expect(source).toContain('继续写');
    expect(source).toContain('快速新建');
    expect(source).toContain('今日处理');
    expect(source).toContain('最近内容');
  });

  test('does not use the old metric-heavy dashboard grid as the primary surface', () => {
    const source = readAdminPageSource();

    expect(source).not.toContain('admin-dashboard-grid');
    expect(source).not.toContain('全部内容');
    expect(source).not.toContain('总浏览');
  });

  test('keeps settings page hierarchy flat instead of stacking framed panels', () => {
    const pageSource = readAdminSettingsPageSource();
    const managerSource = readFileSync(join(process.cwd(), 'src/components/SettingsManager.tsx'), 'utf8');
    const adminCss = readFileSync(join(process.cwd(), 'src/app/styles/admin.css'), 'utf8');

    expect(pageSource).toContain('admin-panel wide admin-panel--settings');
    expect(managerSource).toContain('content-form settings-form');
    expect(adminCss).toContain('.settings-form {\n  background: transparent;');
    expect(adminCss).toContain('.settings-section--primary');
  });

  test('presents settings as grouped admin controls instead of article-style navigation', () => {
    const managerSource = readFileSync(join(process.cwd(), 'src/components/SettingsManager.tsx'), 'utf8');
    const adminCss = readFileSync(join(process.cwd(), 'src/app/styles/admin.css'), 'utf8');

    expect(managerSource).toContain('settings-page-header');
    expect(managerSource).toContain('settings-header-actions');
    expect(managerSource).toContain('settings-layout');
    expect(managerSource).toContain('settings-group');
    expect(managerSource).toContain('settings-group__copy');
    expect(managerSource).toContain('settings-card');
    expect(managerSource).toContain('首页展示');
    expect(managerSource).toContain('仓库维护');
    expect(managerSource).not.toContain('settings-directory');
    expect(managerSource).not.toContain('role="tablist"');
    expect(adminCss).toContain('.settings-layout');
    expect(adminCss).toContain('.settings-group');
    expect(adminCss).toContain('.settings-card');
  });
});
