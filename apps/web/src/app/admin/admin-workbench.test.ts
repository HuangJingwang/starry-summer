import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readAdminPageSource() {
  return readFileSync(join(process.cwd(), 'src/app/admin/page.tsx'), 'utf8');
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
});
