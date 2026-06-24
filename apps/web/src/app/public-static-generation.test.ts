import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('public static generation', () => {
  test('keeps the root layout free of request-scoped APIs', () => {
    const source = readSource('src/app/layout.tsx');

    expect(source).not.toContain("next/headers");
    expect(source).not.toContain('cookies()');
    expect(source).toContain('data-theme="summer-night"');
  });

  test('prebuilds public content detail routes from repository content', () => {
    for (const path of [
      'src/app/posts/[slug]/page.tsx',
      'src/app/notes/[slug]/page.tsx',
      'src/app/moments/[slug]/page.tsx',
      'src/app/projects/[slug]/page.tsx',
    ]) {
      const source = readSource(path);

      expect(source).toContain('export async function generateStaticParams()');
      expect(source).toContain('loadSiteContent');
      expect(source).toContain('slug: item.slug ?? item.id');
    }
  });

  test('prebuilds public taxonomy detail routes from repository content', () => {
    for (const path of [
      'src/app/categories/[slug]/page.tsx',
      'src/app/series/[slug]/page.tsx',
      'src/app/tags/[slug]/page.tsx',
    ]) {
      const source = readSource(path);

      expect(source).toContain('export async function generateStaticParams()');
      expect(source).toContain('loadSiteContent');
      expect(source).toContain('slug: group.key');
    }
  });
});
