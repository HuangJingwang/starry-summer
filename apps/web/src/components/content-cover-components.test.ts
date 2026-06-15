import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('content cover components', () => {
  test('renders content cards through the shared cover helper', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ContentCard.tsx'), 'utf8');

    expect(source).toContain('getContentCover(item)');
    expect(source).toContain('src={cover.imageUrl}');
    expect(source).toContain('alt={cover.altText}');
  });

  test('renders notes as article cards in public content lists', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ContentCard.tsx'), 'utf8');
    const contentSource = readFileSync(join(process.cwd(), 'src/lib/content-public.ts'), 'utf8');

    expect(source).toContain('formatPublicContentType(item.type)');
    expect(contentSource).toContain("note: '文章'");
    expect(source).not.toContain('{item.type}');
  });

  test('renders public detail and archive type labels through the article formatter', () => {
    const detailSource = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');
    const archivesSource = readFileSync(join(process.cwd(), 'src/app/archives/page.tsx'), 'utf8');

    expect(detailSource).toContain('formatPublicContentType(item.type)');
    expect(archivesSource).toContain('formatPublicContentType(item.type)');
    expect(detailSource).not.toContain('<p className="eyebrow">{item.type}</p>');
    expect(archivesSource).not.toContain('<span>{item.type}</span>');
  });

  test('renders content detail covers through the shared cover helper', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');

    expect(source).toContain('getContentCover(item)');
    expect(source).toContain('src={cover.imageUrl}');
    expect(source).toContain('alt={cover.altText}');
  });

  test('renders the content table of contents beside the reader body', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');

    expect(source).toContain('const tableOfContentsNav = tableOfContents.length > 0');
    expect(source).toContain('className={`detail-reader ${tableOfContentsNav ?');
    expect(source).toContain('{tableOfContentsNav}');
    expect(source).toContain('<div className="detail-reader__main">');
  });
});
