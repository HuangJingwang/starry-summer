import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('leetcode archive page', () => {
  test('uses the repository dashboard for the public study archive', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/leetcode/page.tsx'), 'utf8');

    expect(source).toContain('loadRepositoryStudyDashboard');
    expect(source).toContain('study-heatmap');
    expect(source).toContain('study-note-list');
    expect(source).toContain('recentStudyNotes');
    expect(source).not.toContain('loadPublicStudyDashboard');
    expect(source).not.toContain('API_BASE_URL');
  });
});
