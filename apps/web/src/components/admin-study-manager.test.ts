import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('admin study manager', () => {
  test('blocks old database study actions in repository mode', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminStudyManager.tsx'), 'utf8');

    expect(source).toContain('repositoryMode?: boolean;');
    expect(source).toContain('const repositoryActionMessage');
    expect(source).toContain('仓库模式下不会调用旧数据库学习接口');
    expect(source).toContain('if (repositoryMode)');
    expect(source).toContain('const actionDisabled = studyBusy || repositoryMode;');
    expect(source).toContain('disabled={actionDisabled}');
    expect(source).toContain('readOnly={repositoryMode}');
    expect(source).toContain('disabled={repositoryMode}');
  });

  test('keeps legacy API error handling behind the repository guard during migration', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminStudyManager.tsx'), 'utf8');

    expect(source).toContain('readStudyErrorMessage');
    expect(source).toContain('error instanceof Error ? error.message');
    expect(source).toContain('buildUpdateStudySettingsRequest');
    expect(source).toContain('buildSyncStudyRequest()');
    expect(source.indexOf('if (repositoryMode)')).toBeLessThan(source.indexOf('const response = await fetch(request.url, request.init);'));
  });
});
