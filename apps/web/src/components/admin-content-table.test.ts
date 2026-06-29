import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('AdminContentTable source', () => {
  test('keeps filtering and direct row actions for repository content', () => {
    const source = readSource('src/components/AdminContentTable.tsx');

    expect(source).toContain("'use client';");
    expect(source).toContain('filterAdminContent');
    expect(source).toContain('href={`/admin/content/${item.id}`}');
    expect(source).toContain('编辑');
    expect(source).toContain('预览');
    expect(source).toContain('复制链接');
  });

  test('does not keep old database bulk action requests', () => {
    const source = readSource('src/components/AdminContentTable.tsx');

    expect(source).toContain('不再发送批量数据库请求');
    expect(source).not.toContain('admin-table-bulkbar');
    expect(source).not.toContain('批量数据库操作已停用');
    expect(source).not.toContain('buildAdminContentBulkActionRequests');
    expect(source).not.toContain('runBulkAction');
    expect(source).not.toContain('fetch(request.url');
    expect(source).not.toContain('/api/admin/content');
  });

  test('uses compact content filtering controls on the admin content route', () => {
    const source = readSource('src/app/admin/content/page.tsx');

    expect(source).toContain('admin-filter-bar');
    expect(source).toContain('admin-type-segments');
    expect(source).toContain('admin-status-chips');
    expect(source).toContain('更多筛选');
  });
});
