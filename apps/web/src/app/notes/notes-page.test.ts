import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('notes route source', () => {
  test('renders a dedicated notes index instead of permanently redirecting to posts', () => {
    const source = readSource('src/app/notes/page.tsx');

    expect(source).toContain("title: '笔记'");
    expect(source).toContain("path: '/notes'");
    expect(source).toContain("loadSiteContent('note', 'latest')");
    expect(source).toContain("loadSiteContent('note', 'popular')");
    expect(source).not.toContain('searchParams');
    expect(source).toContain('<h1>笔记</h1>');
    expect(source).not.toContain('permanentRedirect');
  });

  test('serves note detail pages directly while keeping post detail aliases intact', () => {
    const source = readSource('src/app/notes/[slug]/page.tsx');

    expect(source).toContain("const item = getContentBySlug(content, 'note', slug);");
    expect(source).toContain('<ContentDetail item={item} adjacent={getAdjacentContent(content, item.id)} />');
    expect(source).not.toContain('permanentRedirect');
  });
});
