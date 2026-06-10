import { extractMarkdownHeadings, type MarkdownHeading } from '@starry-summer/markdown';

const MIN_VISIBLE_TOC_ITEMS = 2;

export function buildContentTableOfContents(markdown: string): MarkdownHeading[] {
  const headings = extractMarkdownHeadings(markdown);

  return headings.length >= MIN_VISIBLE_TOC_ITEMS ? headings : [];
}
