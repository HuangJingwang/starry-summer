import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('AdminContentTable source', () => {
  test('keeps selection, filtering, and edit navigation for repository content', () => {
    const source = readSource('src/components/AdminContentTable.tsx');

    expect(source).toContain("'use client';");
    expect(source).toContain('selectedIds');
    expect(source).toContain('buildAdminContentSelectionState');
    expect(source).toContain('filterAdminContent');
    expect(source).toContain('admin-table-bulkbar');
    expect(source).toContain('href={`/admin/content/${item.id}`}');
    expect(source).toContain('编辑');
  });

  test('does not keep old database bulk action requests', () => {
    const source = readSource('src/components/AdminContentTable.tsx');

    expect(source).toContain('批量数据库操作已停用');
    expect(source).toContain('不再发送批量数据库请求');
    expect(source).not.toContain('buildAdminContentBulkActionRequests');
    expect(source).not.toContain('runBulkAction');
    expect(source).not.toContain('fetch(request.url');
    expect(source).not.toContain('/api/admin/content');
  });

  test('announces selection count and repository-only status accessibly', () => {
    const source = readSource('src/components/AdminContentTable.tsx');

    expect(source).toContain('<strong role="status" aria-live="polite">当前列表已选择 {selectedCount} 条</strong>');
    expect(source).toContain('className="form-message form-message--idle" role="status" aria-live="polite"');
    expect(source).toContain('aria-label="选择全部内容"');
  });

  test('shows an indeterminate select-all checkbox when only some filtered items are selected', () => {
    const source = readSource('src/components/AdminContentTable.tsx');

    expect(source).toContain("import { useEffect, useRef, useState } from 'react';");
    expect(source).toContain('const selectAllRef = useRef<HTMLInputElement>(null);');
    expect(source).toContain('const selectionState = buildAdminContentSelectionState(filtered, selectedIds);');
    expect(source).toContain('const partiallySelected = selectionState.partiallySelected;');
    expect(source).toContain('selectAllRef.current.indeterminate = partiallySelected;');
    expect(source).toContain('ref={selectAllRef}');
    expect(source).toContain("aria-checked={partiallySelected ? 'mixed' : allSelected}");
  });
});
