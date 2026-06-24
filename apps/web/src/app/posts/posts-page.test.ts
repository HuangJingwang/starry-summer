import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('posts page', () => {
  test('offers the series index from the article list instead of the global navigation', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/posts/page.tsx'), 'utf8');
    const archiveSource = readFileSync(join(process.cwd(), 'src/components/PublicArchiveList.tsx'), 'utf8');

    expect(source).toContain("browseAriaLabel: '文章浏览'");
    expect(source).toContain("browseHref: '/series'");
    expect(source).toContain("browseLabel: '专题'");
    expect(archiveSource).toContain('aria-label={labels.browseAriaLabel}');
    expect(archiveSource).toContain('<Link href={labels.browseHref}>{labels.browseLabel}</Link>');
  });

  test('keeps the article list title from repeating the writing eyebrow', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/posts/page.tsx'), 'utf8');

    expect(source).toContain('<h1>文章</h1>');
    expect(source).not.toContain('<p className="eyebrow">写作</p>');
  });

  test('renders posts as a YYsuni-style grouped archive instead of shared cards', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/posts/page.tsx'), 'utf8');
    const archiveSource = readFileSync(join(process.cwd(), 'src/components/PublicArchiveList.tsx'), 'utf8');

    expect(source).toContain('<PublicArchiveSortClient');
    expect(source).toContain('<PublicArchiveList');
    expect(archiveSource).toContain('className="posts-archive"');
    expect(archiveSource).toContain('className="posts-archive-group"');
    expect(archiveSource).toContain('className="posts-archive-group__heading"');
    expect(archiveSource).toContain('className="posts-archive-item"');
    expect(archiveSource).toContain('className="posts-archive-item__date"');
    expect(archiveSource).toContain('className="posts-archive-item__dot"');
    expect(archiveSource).toContain('className="posts-archive-item__cover-preview"');
    expect(archiveSource).toContain('getContentCover(item)');
    expect(archiveSource).toContain('getContentTaxonomyLinkGroups(item)');
    expect(source).not.toContain('<ContentCard key={item.id} item={item} />');
  });

  test('renders archive taxonomy labels without social hashtag prefixes', () => {
    const archiveSource = readFileSync(join(process.cwd(), 'src/components/PublicArchiveList.tsx'), 'utf8');

    expect(archiveSource).toContain('<span key={taxonomyItem.href}>{taxonomyItem.label}</span>');
    expect(archiveSource).not.toContain('<span key={taxonomyItem.href}>#{taxonomyItem.label}</span>');
  });

  test('keeps the posts module static by moving query sorting to a client controller', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/posts/page.tsx'), 'utf8');
    const sortClient = readFileSync(join(process.cwd(), 'src/components/PublicArchiveSortClient.tsx'), 'utf8');

    expect(source).not.toContain('searchParams');
    expect(source).not.toContain('normalizeContentSort(sortParam)');
    expect(source).toContain("loadSiteContent('article', 'latest')");
    expect(source).toContain("loadSiteContent('article', 'popular')");
    expect(source).toContain('toPublicArchiveItems(latestPosts)');
    expect(source).toContain('toPublicArchiveItems(popularPosts)');
    expect(source).toContain("import { Suspense } from 'react';");
    expect(sortClient).toContain('PublicArchiveGroup[]');
    expect(sortClient).not.toContain('bodyMarkdown');
    expect(sortClient).toContain("'use client';");
    expect(sortClient).toContain("import { useSearchParams } from 'next/navigation';");
    expect(sortClient).toContain('normalizeContentSort(searchParams.get(\'sort\'))');
  });
});
