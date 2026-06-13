import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('leetcode archive page', () => {
  test('renders the public study archive with progress, heatmap, categories, and recent notes', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/leetcode/page.tsx'), 'utf8');

    expect(source).toContain('loadPublicStudyDashboard');
    expect(source).toContain('学习档案');
    expect(source).toContain('study-heatmap');
    expect(source).toContain('学习热力');
    expect(source).toContain('分类进度');
    expect(source).toContain('最近提交');
    expect(source).toContain('最近复盘');
    expect(source).toContain('暂无复盘');
    expect(source).toContain('study-note-list');
    expect(source).toContain('recentStudyNotes');
    expect(source).not.toContain('>Heatmap<');
    expect(source).not.toContain('>Categories<');
    expect(source).not.toContain('>Submissions<');
    expect(source).not.toContain('>Review Notes<');
    expect(source).not.toContain('EMPTY NOTES');
    expect(source).not.toContain('AI 简历');
    expect(source).not.toContain('模拟面试');
  });
});
