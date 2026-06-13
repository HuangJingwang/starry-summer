import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('admin project creation route', () => {
  test('keeps project creation inside the project management section', () => {
    const projectsPage = readFileSync(join(process.cwd(), 'src/app/admin/projects/page.tsx'), 'utf8');
    const newProjectPage = readFileSync(join(process.cwd(), 'src/app/admin/projects/new/page.tsx'), 'utf8');

    expect(projectsPage).toContain('href="/admin/projects/new"');
    expect(newProjectPage).toContain('<h1>新建项目</h1>');
    expect(newProjectPage).toContain("initialValue={{ type: 'project' }}");
  });
});
