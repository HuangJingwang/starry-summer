import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('admin study manager', () => {
  test('keeps static repository mode controls interactive while guarding old API actions', () => {
    const source = [
      readSource('src/components/AdminStudyManager.tsx'),
      readSource('src/components/AdminStudySettingsPanel.tsx'),
      readSource('src/components/AdminStudyTaskPanel.tsx'),
      readSource('src/components/AdminStudyProblemList.tsx'),
    ].join('\n');

    expect(source).toContain('repositoryMode?: boolean;');
    expect(source).toContain('const repositoryActionMessage');
    expect(source).toContain('静态站不会调用旧数据库学习接口');
    expect(source).toContain('apps/web/content/leetcode/dashboard.json');
    expect(source).toContain('if (repositoryMode)');
    expect(source).toContain('const actionDisabled = studyBusy;');
    expect(source).toContain('disabled={actionDisabled}');
    expect(source).not.toContain('const actionDisabled = studyBusy || repositoryMode;');
    expect(source).not.toContain('readOnly={repositoryMode}');
    expect(source).not.toContain('disabled={repositoryMode}');
  });

  test('keeps legacy API error handling behind the repository guard during migration', () => {
    const source = readSource('src/components/AdminStudyManager.tsx');

    expect(source).toContain('readStudyErrorMessage');
    expect(source).toContain('error instanceof Error ? error.message');
    expect(source).toContain('buildUpdateStudySettingsRequest');
    expect(source).toContain('buildSyncStudyRequest()');
    expect(source.indexOf('if (repositoryMode)')).toBeLessThan(source.indexOf('const response = await fetch(request.url, request.init);'));
  });

  test('splits the dense study workbench into focused admin panels', () => {
    const source = readSource('src/components/AdminStudyManager.tsx');
    const settingsSource = readSource('src/components/AdminStudySettingsPanel.tsx');
    const taskSource = readSource('src/components/AdminStudyTaskPanel.tsx');
    const problemListSource = readSource('src/components/AdminStudyProblemList.tsx');

    expect(source).toContain('AdminStudySettingsPanel');
    expect(source).toContain('AdminStudyTaskPanel');
    expect(source).toContain('AdminStudyProblemList');
    expect(source).not.toContain('<form className="admin-study-settings"');
    expect(settingsSource).toContain('export function AdminStudySettingsPanel');
    expect(settingsSource).toContain('admin-study-settings');
    expect(taskSource).toContain('export function AdminStudyTaskPanel');
    expect(taskSource).toContain('admin-study-task-grid');
    expect(problemListSource).toContain('export function AdminStudyProblemList');
    expect(problemListSource).toContain('admin-study-problem-list');
  });
});
