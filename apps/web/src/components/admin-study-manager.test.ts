import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('admin study manager', () => {
  test('surfaces specific API errors for study management actions', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminStudyManager.tsx'), 'utf8');

    expect(source).toContain('readStudyErrorMessage');
    expect(source).toContain('error instanceof Error ? error.message');
    expect(source).toContain('buildUpdateStudySettingsRequest');
    expect(source).toContain('buildSyncStudyRequest(),');
    expect(source).toContain("'设置保存失败，请确认已登录且 API 服务可用。'");
    expect(source).toContain("'同步失败，请检查 LeetCode 用户名和 API 服务。'");
    expect(source).not.toContain('throw new Error(`Request failed with ${response.status}`)');
  });
});
