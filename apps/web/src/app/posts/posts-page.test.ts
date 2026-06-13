import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('posts page', () => {
  test('offers the series index from the article list instead of the global navigation', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/posts/page.tsx'), 'utf8');

    expect(source).toContain('aria-label="文章浏览"');
    expect(source).toContain('href="/series"');
    expect(source).toContain('专题');
  });
});
