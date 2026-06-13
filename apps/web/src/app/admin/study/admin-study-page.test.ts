import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('admin study page', () => {
  test('mounts a Chinese dense study workbench for private learning tracking', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/admin/study/page.tsx'), 'utf8');

    expect(source).toContain('AdminStudyManager');
    expect(source).toContain('学习追踪');
    expect(source).toContain('今日任务');
    expect(source).toContain('复习轮次');
    expect(source).toContain('生成周报草稿');
  });
});
