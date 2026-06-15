import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('admin study page', () => {
  test('mounts a Chinese dense study workbench from repository data', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/admin/study/page.tsx'), 'utf8');

    expect(source).toContain('loadRepositoryStudyDashboard');
    expect(source).toContain('const initialResult = await loadRepositoryStudyDashboard();');
    expect(source).toContain('<AdminStudyManager initialResult={initialResult} repositoryMode />');
    expect(source).toContain('学习追踪');
    expect(source).toContain('仓库数据');
    expect(source).not.toContain('/api/admin/study');
    expect(source).not.toContain('API_BASE_URL');
  });
});
