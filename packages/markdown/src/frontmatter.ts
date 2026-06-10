import matter from 'gray-matter';

export type MarkdownFrontmatterValue =
  | string
  | number
  | boolean
  | null
  | MarkdownFrontmatterValue[]
  | { [key: string]: MarkdownFrontmatterValue };

export type MarkdownFrontmatter = Record<string, MarkdownFrontmatterValue>;

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
