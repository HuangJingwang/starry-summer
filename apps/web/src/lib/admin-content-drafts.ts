import type { ContentVisibility } from '@starry-summer/shared';

import { validContentVisibility } from './admin-content-normalize';
import type { ContentDraftSnapshot, MarkdownPreviewModel } from './admin-content-types';

export function createMarkdownPreview(markdown: string): MarkdownPreviewModel {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.find((line) => line.startsWith('# '));
  const firstParagraph = lines.find((line) => !line.startsWith('#') && !line.startsWith('```')) ?? '';
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]()!-]/g, ' ')
    .trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  return {
    title: heading?.replace(/^#\s+/, '').trim() || 'Untitled',
    excerpt: firstParagraph,
    wordCount,
  };
}

export function getUnsavedContentWarning(isDirty: boolean): string | null {
  return isDirty ? '你有尚未保存的内容更改。' : null;
}

export function getContentDraftStorageKey(contentId?: string): string {
  return `starry-summer:content-draft:${contentId || 'new'}`;
}

export function serializeContentDraftSnapshot(snapshot: ContentDraftSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseContentDraftSnapshot(value: string | null): ContentDraftSnapshot | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ContentDraftSnapshot>;

    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.slug !== 'string' ||
      typeof parsed.summary !== 'string' ||
      !validContentVisibility.has(parsed.visibility as ContentVisibility) ||
      typeof parsed.bodyMarkdown !== 'string' ||
      typeof parsed.savedAt !== 'string'
    ) {
      return null;
    }

    return {
      title: parsed.title,
      slug: parsed.slug,
      summary: parsed.summary,
      ...(typeof parsed.seoTitle === 'string' ? { seoTitle: parsed.seoTitle } : {}),
      ...(typeof parsed.seoDescription === 'string' ? { seoDescription: parsed.seoDescription } : {}),
      visibility: parsed.visibility as ContentVisibility,
      bodyMarkdown: parsed.bodyMarkdown,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}
