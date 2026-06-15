import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { seedContent } from '../apps/web/src/lib/content-seed';
import type { SiteContentItem } from '../apps/web/src/lib/content-types';

const JUEJIN_USER_ID = '959206842703773';
const JUEJIN_LIST_URL = 'https://api.juejin.cn/content_api/v1/article/query_list';
const JUEJIN_POST_URL = 'https://juejin.cn/post/';
const STATIC_CONTENT_PATH = join(process.cwd(), 'apps', 'web', 'content', 'public-content.json');
const PUBLIC_IMAGE_ROOT = join(process.cwd(), 'apps', 'web', 'public', 'images', 'juejin');

interface JuejinListResponse {
  err_no: number;
  err_msg: string;
  data: JuejinArticleItem[];
  cursor: string;
  has_more: boolean;
}

interface JuejinArticleItem {
  article_id: string;
  article_info: {
    article_id: string;
    title: string;
    brief_content: string;
    cover_image: string;
    ctime: string;
    mtime: string;
    rtime: string;
    view_count: number;
    digg_count: number;
  };
  category?: {
    category_name: string;
  };
  tags?: Array<{
    tag_name: string;
  }>;
}

interface ImportedArticle {
  articleId: string;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  sourceUrl: string;
  coverImageUrl: string;
  publishedAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  categories: string[];
  tags: string[];
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const downloadImages = args.has('--download-images');

async function main() {
  let articles = await fetchArticles();
  console.log(`Fetched ${articles.length} article(s) from Juejin.`);

  if (downloadImages) {
    articles = await localizeArticleImages(articles);
  }

  if (dryRun) {
    for (const article of articles) {
      console.log(`- ${article.publishedAt.slice(0, 10)} ${article.title} (${article.bodyMarkdown.length} chars)`);
    }
    return;
  }

  await writeStaticContent(articles);
  console.log(`Wrote ${articles.length} Juejin article(s) to ${STATIC_CONTENT_PATH}.`);
}

async function fetchArticles(): Promise<ImportedArticle[]> {
  const items: JuejinArticleItem[] = [];
  let cursor = '0';

  do {
    const response = await fetchJson<JuejinListResponse>(JUEJIN_LIST_URL, {
      user_id: JUEJIN_USER_ID,
      sort_type: 2,
      cursor,
    });

    if (response.err_no !== 0) {
      throw new Error(`Juejin list request failed: ${response.err_msg}`);
    }

    items.push(...response.data);
    cursor = response.has_more ? response.cursor : '';
  } while (cursor);

  const articles: ImportedArticle[] = [];
  for (const item of items) {
    const article = await fetchArticleDetail(item);
    articles.push(article);
  }

  return articles;
}

async function fetchArticleDetail(item: JuejinArticleItem): Promise<ImportedArticle> {
  const articleId = item.article_info.article_id || item.article_id;
  const sourceUrl = `${JUEJIN_POST_URL}${articleId}`;
  const response = await fetch(sourceUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 StarrySummerImporter/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Juejin article request failed for ${articleId}: ${response.status}`);
  }

  const html = await response.text();
  const bodyMarkdown = (
    extractNuxtStringField(html, 'mark_content')
    || htmlToMarkdown(extractNuxtStringField(html, 'web_html_content'))
  ).trim();

  if (!bodyMarkdown) {
    throw new Error(`Juejin article ${articleId} did not include markdown content`);
  }

  return {
    articleId,
    title: item.article_info.title.trim(),
    slug: `juejin-${articleId}`,
    summary: normalizeSummary(item.article_info.brief_content),
    bodyMarkdown,
    sourceUrl,
    coverImageUrl: item.article_info.cover_image,
    publishedAt: toIsoDate(item.article_info.rtime, item.article_info.ctime),
    updatedAt: toIsoDate(item.article_info.mtime, item.article_info.ctime),
    viewCount: item.article_info.view_count,
    likeCount: item.article_info.digg_count,
    categories: uniqueCompact(['掘金', item.category?.category_name]),
    tags: uniqueCompact(item.tags?.map((tag) => tag.tag_name) ?? []),
  };
}

async function fetchJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 StarrySummerImporter/1.0',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function writeStaticContent(articles: ImportedArticle[]): Promise<void> {
  await mkdir(join(process.cwd(), 'apps', 'web', 'content'), { recursive: true });
  const existing = await readStaticContent();
  const imported = articles.map(toSiteContentItem);
  const importedKeys = new Set(imported.flatMap((item) => [item.id, item.slug, item.sourceUrl]).filter(Boolean));
  const preserved = existing.filter((item) => {
    const itemKeys = [item.id, item.slug, item.sourceUrl].filter(Boolean);
    const isJuejinImport = item.id.startsWith('juejin-') || item.slug?.startsWith('juejin-') || item.sourceUrl?.startsWith(JUEJIN_POST_URL);

    return !isJuejinImport && !itemKeys.some((key) => importedKeys.has(key));
  });
  const content = [...preserved, ...imported].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  await writeFile(STATIC_CONTENT_PATH, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
}

async function readStaticContent(): Promise<SiteContentItem[]> {
  try {
    return JSON.parse(await readFile(STATIC_CONTENT_PATH, 'utf8')) as SiteContentItem[];
  } catch {
    return seedContent;
  }
}

function toSiteContentItem(article: ImportedArticle): SiteContentItem {
  return {
    id: `juejin-${article.articleId}`,
    title: article.title,
    type: 'post',
    status: 'published',
    visibility: 'public',
    publishedAt: article.publishedAt.slice(0, 10),
    updatedAt: article.updatedAt.slice(0, 10),
    summary: article.summary,
    seoTitle: article.title,
    seoDescription: article.summary,
    bodyMarkdown: article.bodyMarkdown,
    sourceType: 'original',
    sourceUrl: article.sourceUrl,
    coverImageUrl: article.coverImageUrl || undefined,
    coverAltText: article.coverImageUrl ? `${article.title} cover` : undefined,
    slug: article.slug,
    featured: false,
    pinned: false,
    categories: article.categories,
    tags: article.tags,
    series: ['Juejin Archive'],
    viewCount: article.viewCount,
    likeCount: article.likeCount,
    allowComments: true,
  };
}

async function localizeArticleImages(articles: ImportedArticle[]): Promise<ImportedArticle[]> {
  const cache = new Map<string, Promise<string>>();

  return Promise.all(
    articles.map(async (article) => {
      const localize = (url: string, kind: string) => {
        const normalizedUrl = decodeHtml(url);

        if (!isRemoteImageUrl(normalizedUrl)) {
          return Promise.resolve(normalizedUrl);
        }

        const cacheKey = `${article.articleId}:${normalizedUrl}`;
        const cached = cache.get(cacheKey);

        if (cached) {
          return cached;
        }

        const promise = downloadImage(normalizedUrl, article.articleId, kind).catch((error) => {
          console.warn(`Failed to download image for ${article.articleId}: ${normalizedUrl} (${String(error)})`);
          return normalizedUrl;
        });
        cache.set(cacheKey, promise);
        return promise;
      };

      const coverImageUrl = article.coverImageUrl
        ? await localize(article.coverImageUrl, 'cover')
        : article.coverImageUrl;
      const bodyMarkdown = await localizeMarkdownImages(article.bodyMarkdown, localize);

      return {
        ...article,
        coverImageUrl,
        bodyMarkdown,
      };
    }),
  );
}

async function localizeMarkdownImages(
  markdown: string,
  localize: (url: string, kind: string) => Promise<string>,
): Promise<string> {
  const replacements: Array<{ original: string; replacement: string }> = [];
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g;
  const htmlImagePattern = /<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi;

  for (const match of markdown.matchAll(imagePattern)) {
    const [original, alt, url, title = ''] = match;
    const replacementUrl = await localize(url, 'body');
    replacements.push({
      original,
      replacement: `![${alt}](${replacementUrl}${title})`,
    });
  }

  for (const match of markdown.matchAll(htmlImagePattern)) {
    const [original, url] = match;
    const alt = extractHtmlAttribute(original, 'alt') || 'image';
    const replacementUrl = await localize(url, 'body');
    replacements.push({
      original,
      replacement: `![${alt}](${replacementUrl})`,
    });
  }

  return replacements.reduce((result, item) => result.replace(item.original, item.replacement), markdown);
}

function extractHtmlAttribute(html: string, attribute: string): string {
  const match = html.match(new RegExp(`\\b${attribute}="([^"]*)"`, 'i'));

  return match ? decodeHtml(match[1]).trim() : '';
}

async function downloadImage(url: string, articleId: string, kind: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 StarrySummerImporter/1.0',
      referer: 'https://juejin.cn/',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') ?? '';
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  const extension = getImageExtension(url, contentType);
  const directory = join(PUBLIC_IMAGE_ROOT, articleId);
  const fileName = `${kind}-${hash}${extension}`;

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, fileName), bytes);

  return `/images/juejin/${articleId}/${fileName}`;
}

function isRemoteImageUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function getImageExtension(url: string, contentType: string): string {
  const fromContentType = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/gif', '.gif'],
    ['image/webp', '.webp'],
    ['image/svg+xml', '.svg'],
    ['image/avif', '.avif'],
  ]).get(contentType.split(';')[0].trim().toLowerCase());

  if (fromContentType) {
    return fromContentType;
  }

  try {
    const extension = extname(new URL(url).pathname).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'].includes(extension)) {
      return extension === '.jpeg' ? '.jpg' : extension;
    }
  } catch {
    // Fall through to a safe default.
  }

  return '.webp';
}

function extractNuxtStringField(html: string, field: string): string {
  const marker = `${field}:`;
  let start = html.indexOf(marker);

  while (start !== -1 && html[start + marker.length] !== '"') {
    start = html.indexOf(marker, start + marker.length);
  }

  if (start === -1) {
    return '';
  }

  const quoteStart = start + marker.length;

  let escaped = false;
  for (let index = quoteStart + 1; index < html.length; index += 1) {
    const char = html[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      return JSON.parse(html.slice(quoteStart, index + 1)) as string;
    }
  }

  return '';
}

function htmlToMarkdown(html: string): string {
  if (!html) {
    return '';
  }

  let markdown = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<pre[^>]*><code[^>]*class="[^"]*language-([^"\s]+)[^"]*"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, language, code) => {
      return `\n\n\`\`\`${language}\n${decodeHtml(stripTags(code)).trim()}\n\`\`\`\n\n`;
    })
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
      return `\n\n\`\`\`\n${decodeHtml(stripTags(code)).trim()}\n\`\`\`\n\n`;
    })
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, text) => {
      return `\n\n${'#'.repeat(Number(level))} ${decodeHtml(stripTags(text)).trim()}\n\n`;
    })
    .replace(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi, (_, src, alt) => {
      return `\n\n![${decodeHtml(alt).trim()}](${decodeHtml(src).trim()})\n\n`;
    })
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]+)"[^>]*>/gi, (_, alt, src) => {
      return `\n\n![${decodeHtml(alt).trim()}](${decodeHtml(src).trim()})\n\n`;
    })
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const label = decodeHtml(stripTags(text)).trim();
      return label ? `[${label}](${decodeHtml(href).trim()})` : decodeHtml(href).trim();
    })
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => `\`${decodeHtml(stripTags(code)).trim()}\``)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${decodeHtml(stripTags(item)).trim()}`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `\n\n${decodeHtml(stripTags(text)).trim()}\n\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|section|article|blockquote|ul|ol|table|thead|tbody|tr)>/gi, '\n\n');

  markdown = decodeHtml(stripTags(markdown));

  return markdown
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, '');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)));
}

function normalizeSummary(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 220);
}

function toIsoDate(primaryUnixSeconds: string, fallbackUnixSeconds: string): string {
  const primary = Number(primaryUnixSeconds);
  const fallback = Number(fallbackUnixSeconds);
  const seconds = primary > 0 ? primary : fallback;

  return new Date(seconds * 1000).toISOString();
}

function uniqueCompact(values: Array<string | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
