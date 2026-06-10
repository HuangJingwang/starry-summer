import sanitizeHtml from 'sanitize-html';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export interface MarkdownHeading {
  depth: number;
  text: string;
  slug: string;
}

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'img',
  'pre',
  'code',
  'span',
]);

const allowedAttributes: sanitizeHtml.IOptions['allowedAttributes'] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ['href', 'name', 'target', 'rel'],
  h1: ['id'],
  h2: ['id'],
  h3: ['id'],
  h4: ['id'],
  h5: ['id'],
  h6: ['id'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  code: ['class'],
  span: ['class'],
};

export async function renderMarkdown(markdown: string): Promise<string> {
  const rendered = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeHeadingIds)
    .use(rehypeStringify)
    .process(markdown);

  return sanitizeHtml(String(rendered), {
    allowedTags,
    allowedAttributes,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'nofollow noopener noreferrer',
      }),
      img: sanitizeHtml.simpleTransform('img', {
        loading: 'lazy',
      }),
    },
  });
}

export function extractMarkdownHeadings(markdown: string, minDepth = 2, maxDepth = 3): MarkdownHeading[] {
  const tree = unified().use(remarkParse).parse(markdown);
  const slugger = createHeadingSlugger();
  const headings: MarkdownHeading[] = [];

  visitTree(tree, (node) => {
    if (node.type !== 'heading' || typeof node.depth !== 'number') {
      return;
    }

    const text = collectText(node).trim();

    if (!text) {
      return;
    }

    const slug = slugger.slug(text);

    if (node.depth >= minDepth && node.depth <= maxDepth) {
      headings.push({
        depth: node.depth,
        text,
        slug,
      });
    }
  });

  return headings;
}

function rehypeHeadingIds() {
  return (tree: MarkdownNode) => {
    const slugger = createHeadingSlugger();

    visitTree(tree, (node) => {
      if (node.type !== 'element' || !isHeadingTag(node.tagName)) {
        return;
      }

      const text = collectText(node).trim();

      if (!text) {
        return;
      }

      node.properties = {
        ...(node.properties ?? {}),
        id: slugger.slug(text),
      };
    });
  };
}

interface MarkdownNode {
  type?: string;
  depth?: number;
  tagName?: string;
  value?: unknown;
  children?: MarkdownNode[];
  properties?: Record<string, unknown>;
}

function visitTree(node: MarkdownNode, visitor: (node: MarkdownNode) => void): void {
  visitor(node);

  for (const child of node.children ?? []) {
    visitTree(child, visitor);
  }
}

function collectText(node: MarkdownNode): string {
  if (typeof node.value === 'string') {
    return node.value;
  }

  return (node.children ?? []).map((child) => collectText(child)).join('');
}

function isHeadingTag(tagName: string | undefined): boolean {
  return Boolean(tagName && /^h[1-6]$/.test(tagName));
}

function createHeadingSlugger() {
  const seen = new Map<string, number>();

  return {
    slug(text: string): string {
      const base = slugifyHeading(text) || 'section';
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);

      return count === 1 ? base : `${base}-${count}`;
    },
  };
}

function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .replace(/[^\p{Letter}\p{Number}\s_-]+/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
