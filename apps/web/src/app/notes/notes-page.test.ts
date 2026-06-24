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
    expect(source).toContain('<h1>笔记</h1>');
    expect(source).not.toContain('permanentRedirect');
  });

  test('keeps the notes module static by moving query sorting to a client controller', () => {
    const source = readSource('src/app/notes/page.tsx');
    const sortClient = readSource('src/components/PublicArchiveSortClient.tsx');

    expect(source).not.toContain('searchParams');
    expect(source).not.toContain('normalizeContentSort(sortParam)');
    expect(source).toContain('toPublicArchiveItems(latestNotes)');
    expect(source).toContain('toPublicArchiveItems(popularNotes)');
    expect(source).toContain('<PublicArchiveSortClient');
    expect(source).toContain('<PublicArchiveList');
    expect(source).toContain("import { Suspense } from 'react';");
    expect(sortClient).toContain('PublicArchiveGroup[]');
    expect(sortClient).not.toContain('bodyMarkdown');
    expect(sortClient).toContain("'use client';");
    expect(sortClient).toContain("import { useSearchParams } from 'next/navigation';");
  });

  test('serves note detail pages directly while keeping post detail aliases intact', () => {
    const source = readSource('src/app/notes/[slug]/page.tsx');

    expect(source).toContain("const item = getContentBySlug(content, 'note', slug);");
    expect(source).toContain('<ContentDetail item={item} adjacent={getAdjacentContent(content, item.id)} />');
    expect(source).not.toContain('permanentRedirect');
  });
});
