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

  test('omits the public detail eyebrow while archives keep type labels through the formatter', () => {
    const detailSource = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');
    const archivesSource = readFileSync(join(process.cwd(), 'src/app/archives/page.tsx'), 'utf8');

    expect(archivesSource).toContain('formatPublicContentType(item.type)');
    expect(detailSource).not.toContain('formatPublicContentType(item.type)');
    expect(detailSource).not.toContain('<p className="eyebrow">{formatPublicContentType(item.type)}</p>');
    expect(detailSource).not.toContain('<p className="eyebrow">{item.type}</p>');
    expect(archivesSource).not.toContain('<span>{item.type}</span>');
  });

  test('renders content detail covers through the shared cover helper', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');

    expect(source).toContain('getContentCover(item)');
    expect(source).toContain('src={cover.imageUrl}');
    expect(source).toContain('alt={cover.altText}');
  });

  test('renders the content table of contents outside the article reader body', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');

    expect(source).toContain('const tableOfContentsNav = tableOfContents.length > 0');
    expect(source).toContain('className={`detail-shell ${tableOfContentsNav ?');
    expect(source).toContain('{tableOfContentsNav}');
    expect(source).toContain('<article className="detail">');
    expect(source.indexOf('{tableOfContentsNav}')).toBeLessThan(source.indexOf('<article className="detail">'));
    expect(source).toContain('className={`detail-reader ${tableOfContentsNav ?');
    expect(source).toContain('<div className="detail-reader__main">');
    expect(source).not.toContain('<div className={`detail-layout ${tableOfContentsNav ?');
  });
});
