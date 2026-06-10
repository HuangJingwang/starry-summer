import { describe, expect, test } from 'vitest';

import { parseMarkdownDocument, serializeMarkdownDocument } from './frontmatter';

describe('Markdown front matter ownership helpers', () => {
  test('parses front matter and body', () => {
    const parsed = parseMarkdownDocument('---\ntitle: Hello\nslug: hello\n---\n# Hello');

    expect(parsed.frontmatter.title).toBe('Hello');
    expect(parsed.frontmatter.slug).toBe('hello');
    expect(parsed.body).toBe('# Hello');
  });

  test('serializes front matter and body', () => {
    const text = serializeMarkdownDocument({
      frontmatter: { title: 'Hello', slug: 'hello' },
      body: '# Hello',
    });

    expect(text).toContain('title: Hello');
    expect(text).toContain('slug: hello');
    expect(text.endsWith('# Hello\n')).toBe(true);
  });
});
