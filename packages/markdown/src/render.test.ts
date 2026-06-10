import { describe, expect, test } from 'vitest';

import { renderMarkdown } from './render';

describe('Markdown rendering', () => {
  test('renders headings and paragraphs', async () => {
    const html = await renderMarkdown('# Hello\n\nWorld');

    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('<p>World</p>');
  });

  test('removes script tags from rendered html', async () => {
    const html = await renderMarkdown('<script>alert(1)</script>\n\nSafe');

    expect(html).not.toContain('<script');
    expect(html).toContain('Safe');
  });
});
