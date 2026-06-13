import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('AdminContentTable source', () => {
  test('offers batch selection and common owner actions', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentTable.tsx'), 'utf8');

    expect(source).toContain("'use client';");
    expect(source).toContain('selectedIds');
    expect(source).toContain('admin-table-bulkbar');
    expect(source).toContain('buildAdminContentBulkActionRequests');
    expect(source).toContain("runBulkAction('publish')");
    expect(source).toContain("runBulkAction('archive')");
    expect(source).toContain("runBulkAction('restore-draft')");
    expect(source).toContain("runBulkAction('private')");
    expect(source).toContain("runBulkAction('public')");
    expect(source).toContain('aria-label="选择全部内容"');
  });

  test('keeps bulk actions inactive until content is selected and announces selection count', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentTable.tsx'), 'utf8');

    expect(source).toContain('const selectedCount = selectionState.selectedCount;');
    expect(source).toContain('const bulkActionDisabled = bulkState === \'submitting\' || selectedCount === 0;');
    expect(source).toContain('<strong role="status" aria-live="polite">当前列表已选择 {selectedCount} 条</strong>');
    expect(source).toContain('disabled={bulkActionDisabled}');
    expect(source).not.toContain('disabled={bulkState === \'submitting\'}');
    expect(source).not.toContain('buildAdminContentBulkActionRequests(selectedIds, action)');
  });

  test('shows an indeterminate select-all checkbox when only some filtered items are selected', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminContentTable.tsx'), 'utf8');

    expect(source).toContain("import { useEffect, useRef, useState } from 'react';");
    expect(source).toContain('buildAdminContentSelectionState');
    expect(source).toContain('const selectAllRef = useRef<HTMLInputElement>(null);');
    expect(source).toContain('const selectionState = buildAdminContentSelectionState(filtered, selectedIds);');
    expect(source).toContain('const partiallySelected = selectionState.partiallySelected;');
    expect(source).toContain('selectAllRef.current.indeterminate = partiallySelected;');
    expect(source).toContain('ref={selectAllRef}');
    expect(source).toContain("aria-checked={partiallySelected ? 'mixed' : allSelected}");
  });
});
