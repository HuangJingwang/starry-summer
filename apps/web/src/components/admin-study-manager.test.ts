import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('admin study manager', () => {
  test('blocks old database study actions in repository mode', () => {
    const source = [
      readSource('src/components/AdminStudyManager.tsx'),
      readSource('src/components/AdminStudySettingsPanel.tsx'),
      readSource('src/components/AdminStudyTaskPanel.tsx'),
      readSource('src/components/AdminStudyProblemList.tsx'),
    ].join('\n');

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
