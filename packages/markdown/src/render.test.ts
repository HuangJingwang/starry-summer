import { describe, expect, test } from 'vitest';

import { extractMarkdownHeadings, renderMarkdown } from './render';

describe('Markdown rendering', () => {
  test('renders headings and paragraphs', async () => {
    const html = await renderMarkdown('# Hello\n\nWorld');

    expect(html).toContain('<h1 id="hello"');
    expect(html).toContain('Hello');
    expect(html).toContain('<p>World</p>');
  });

  test('removes script tags from rendered html', async () => {
    const html = await renderMarkdown('<script>alert(1)</script>\n\nSafe');

    expect(html).not.toContain('<script');
    expect(html).toContain('Safe');
  });

  test('extracts article table of contents entries with matching heading anchors', async () => {
    const markdown = [
      '# Page title',
      '',
      '## 开始',
      '',
      '### Why this matters?',
      '',
      '## 开始',
      '',
      '#### Deep detail',
    ].join('\n');

    expect(extractMarkdownHeadings(markdown)).toEqual([
      { depth: 2, text: '开始', slug: '开始' },
      { depth: 3, text: 'Why this matters?', slug: 'why-this-matters' },
      { depth: 2, text: '开始', slug: '开始-2' },
    ]);

    const html = await renderMarkdown(markdown);

    expect(html).toContain('<h2 id="开始">开始</h2>');
    expect(html).toContain('<h3 id="why-this-matters">Why this matters?</h3>');
    expect(html).toContain('<h2 id="开始-2">开始</h2>');
    expect(html).toContain('<h4 id="deep-detail">Deep detail</h4>');
  });
});
