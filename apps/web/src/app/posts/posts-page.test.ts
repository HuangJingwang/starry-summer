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

  test('keeps the article list title from repeating the writing eyebrow', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/posts/page.tsx'), 'utf8');

    expect(source).toContain('<h1>文章</h1>');
    expect(source).not.toContain('<p className="eyebrow">写作</p>');
  });

  test('renders posts as a YYsuni-style grouped archive instead of shared cards', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/posts/page.tsx'), 'utf8');

    expect(source).toContain('groupPostsByYear(posts)');
    expect(source).toContain('className="posts-archive"');
    expect(source).toContain('className="posts-archive-group"');
    expect(source).toContain('className="posts-archive-group__heading"');
    expect(source).toContain('className="posts-archive-item"');
    expect(source).toContain('className="posts-archive-item__date"');
    expect(source).toContain('className="posts-archive-item__dot"');
    expect(source).toContain('className="posts-archive-item__cover-preview"');
    expect(source).toContain('getContentCover(item)');
    expect(source).toContain('getContentTaxonomyLinkGroups(item)');
    expect(source).not.toContain('<ContentCard key={item.id} item={item} />');
  });

  test('renders archive taxonomy labels without social hashtag prefixes', () => {
    const postsSource = readFileSync(join(process.cwd(), 'src/app/posts/page.tsx'), 'utf8');
    const notesSource = readFileSync(join(process.cwd(), 'src/app/notes/page.tsx'), 'utf8');

    expect(postsSource).toContain('<span key={taxonomyItem.href}>{taxonomyItem.label}</span>');
    expect(notesSource).toContain('<span key={taxonomyItem.href}>{taxonomyItem.label}</span>');
    expect(postsSource).not.toContain('<span key={taxonomyItem.href}>#{taxonomyItem.label}</span>');
    expect(notesSource).not.toContain('<span key={taxonomyItem.href}>#{taxonomyItem.label}</span>');
  });
});
