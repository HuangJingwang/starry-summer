import { UnprocessableEntityException } from '@nestjs/common';
import { parseMarkdownDocument, serializeMarkdownDocument, type MarkdownFrontmatterValue } from '@starry-summer/markdown';
import type { ContentType, ContentVisibility, ProjectMetadata } from '@starry-summer/shared';

import {
  normalizeOptionalText,
  normalizeProjectMetadata,
  normalizeSourceUrl,
  normalizeTaxonomyLabels,
  parseContentType,
  slugifyContentTitle,
  toStringArray,
} from './content-normalization.js';
import type { ContentRecord, CreateDraftInput } from './content.types.js';

export interface MarkdownImportModel {
  draft: CreateDraftInput;
  visibility: ContentVisibility;
  allowComments: boolean;
  featured: boolean;
  pinned: boolean;
}

export function parseMarkdownImport(markdown: string, type: ContentType): MarkdownImportModel {
  const document = parseMarkdownDocument(markdown);
  const title = String(document.frontmatter.title ?? 'Untitled');
  const slug = String(document.frontmatter.slug ?? slugifyContentTitle(title));

  return {
    draft: {
      type,
      title,
      slug,
      summary: String(document.frontmatter.summary ?? ''),
      seoTitle: normalizeOptionalText(String(document.frontmatter.seoTitle ?? '')),
      seoDescription: normalizeOptionalText(String(document.frontmatter.seoDescription ?? '')),
      bodyMarkdown: document.body,
      sourceType: document.frontmatter.sourceType === 'repost' ? 'repost' : 'original',
      sourceUrl: normalizeSourceUrl(String(document.frontmatter.sourceUrl ?? '')),
      coverAssetId: normalizeOptionalText(String(document.frontmatter.coverAssetId ?? '')),
      categories: normalizeTaxonomyLabels(toStringArray(document.frontmatter.categories)),
      tags: normalizeTaxonomyLabels(toStringArray(document.frontmatter.tags)),
      series: normalizeTaxonomyLabels(toStringArray(document.frontmatter.series)),
      project: normalizeProjectMetadata(document.frontmatter.project as unknown as ProjectMetadata | undefined),
    },
    visibility: document.frontmatter.visibility === 'private' ? 'private' : 'public',
    allowComments: document.frontmatter.allowComments === false ? false : true,
    featured: document.frontmatter.featured === true,
    pinned: document.frontmatter.pinned === true,
  };
}

export function serializeRecordAsMarkdown(record: ContentRecord): string {
  return serializeMarkdownDocument({
    frontmatter: {
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      ...(record.seoTitle ? { seoTitle: record.seoTitle } : {}),
      ...(record.seoDescription ? { seoDescription: record.seoDescription } : {}),
      sourceType: record.sourceType,
      sourceUrl: record.sourceUrl,
      coverAssetId: record.coverAssetId ?? '',
      type: record.type,
      status: record.status,
      visibility: record.visibility,
      allowComments: record.allowComments,
      featured: record.featured,
      pinned: record.pinned,
      categories: record.categories,
      tags: record.tags,
      series: record.series,
      ...(record.project ? { project: projectToFrontmatter(record.project) } : {}),
      publishedAt: record.publishedAt,
      updatedAt: record.updatedAt,
    },
    body: record.bodyMarkdown,
  });
}

export function parseMarkdownArchiveSections(markdown: string): Array<{ type: ContentType; markdown: string }> {
  const markerPattern = /^<!--\s*starry-summer:content\s+([a-z]+)\/[^\s]+(?:\s+id=[^\s]+)?\s*-->\s*$/gm;
  const matches = [...markdown.matchAll(markerPattern)];

  if (matches.length === 0) {
    throw new UnprocessableEntityException('Markdown archive does not contain any content sections');
  }

  return matches.map((match, index) => {
    const type = parseContentType(match[1]);
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;

    return {
      type,
      markdown: markdown.slice(start, end).trim(),
    };
  });
}

function projectToFrontmatter(project: ProjectMetadata): MarkdownFrontmatterValue {
  const frontmatter: Record<string, MarkdownFrontmatterValue> = {};

  if (project.status) {
    frontmatter.status = project.status;
  }

  if (project.links) {
    frontmatter.links = Object.fromEntries(
      Object.entries(project.links).filter(([, value]) => Boolean(value)),
    ) as Record<string, MarkdownFrontmatterValue>;
  }

  if (project.stack) {
    frontmatter.stack = project.stack;
  }

  if (project.startedAt) {
    frontmatter.startedAt = project.startedAt;
  }

  if (project.endedAt) {
    frontmatter.endedAt = project.endedAt;
  }

  return frontmatter;
}
