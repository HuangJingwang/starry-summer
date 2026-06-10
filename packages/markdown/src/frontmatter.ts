import matter from 'gray-matter';

export type MarkdownFrontmatter = Record<string, string | number | boolean | string[] | null>;

export interface MarkdownDocument {
  frontmatter: MarkdownFrontmatter;
  body: string;
}

export function parseMarkdownDocument(markdown: string): MarkdownDocument {
  const parsed = matter(markdown);

  return {
    frontmatter: parsed.data as MarkdownFrontmatter,
    body: parsed.content.trim(),
  };
}

export function serializeMarkdownDocument(document: MarkdownDocument): string {
  return matter.stringify(`${document.body.trim()}\n`, document.frontmatter);
}
