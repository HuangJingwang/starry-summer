import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { parseMarkdownDocument, serializeMarkdownDocument } from '@starry-summer/markdown';
import type { ContentStatus, ContentType, ContentVisibility } from '@starry-summer/shared';
import { canPublishContent } from '@starry-summer/shared';

import { CONTENT_REPOSITORY, type ContentRepository } from './content.repository.js';

export interface ContentRecord {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  status: ContentStatus;
  visibility: ContentVisibility;
  allowComments: boolean;
  pinned: boolean;
  featured: boolean;
  viewCount: number;
  likeCount: number;
  categories: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CreateDraftInput {
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  categories?: string[];
  tags?: string[];
}

export type UpdateContentInput = Partial<{
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  allowComments: boolean;
  pinned: boolean;
  featured: boolean;
  categories: string[];
  tags: string[];
}>;

export interface PublicContentFilter {
  type?: ContentType;
  sort?: PublicContentSort;
}

export type PublicContentSort = 'latest' | 'popular';

@Injectable()
export class ContentService {
  constructor(
    @Inject(CONTENT_REPOSITORY)
    private readonly repository: ContentRepository,
  ) {}

  async createDraft(input: CreateDraftInput): Promise<ContentRecord> {
    return this.repository.create({
      type: input.type,
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      bodyMarkdown: input.bodyMarkdown,
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: normalizeTaxonomyLabels(input.categories),
      tags: normalizeTaxonomyLabels(input.tags),
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });
  }

  async listAdmin(): Promise<ContentRecord[]> {
    return this.repository.listAdmin();
  }

  async getAdminRecord(id: string): Promise<ContentRecord> {
    return this.getRecord(id);
  }

  async listPublic(filter: PublicContentFilter = {}): Promise<ContentRecord[]> {
    return this.repository.listPublic(filter);
  }

  async updateContent(id: string, input: UpdateContentInput): Promise<ContentRecord> {
    await this.getRecord(id);
    const updated = await this.repository.update(id, {
      ...input,
      categories: input.categories ? normalizeTaxonomyLabels(input.categories) : undefined,
      tags: input.tags ? normalizeTaxonomyLabels(input.tags) : undefined,
      updatedAt: new Date().toISOString(),
    });

    return this.ensureRecord(updated, id);
  }

  async publish(id: string): Promise<ContentRecord> {
    const record = await this.getRecord(id);

    if (!canPublishContent(record)) {
      throw new UnprocessableEntityException('Content is not ready to publish');
    }

    const now = new Date().toISOString();
    const updated = await this.repository.update(id, {
      status: 'published' as const,
      updatedAt: now,
      publishedAt: record.publishedAt ?? now,
    });

    return this.ensureRecord(updated, id);
  }

  async archive(id: string): Promise<ContentRecord> {
    await this.getRecord(id);
    const updated = await this.repository.update(id, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });

    return this.ensureRecord(updated, id);
  }

  async restoreDraft(id: string): Promise<ContentRecord> {
    await this.getRecord(id);
    const updated = await this.repository.update(id, {
      status: 'draft',
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    });

    return this.ensureRecord(updated, id);
  }

  async setVisibility(id: string, visibility: ContentVisibility): Promise<ContentRecord> {
    await this.getRecord(id);
    const updated = await this.repository.update(id, {
      visibility,
      updatedAt: new Date().toISOString(),
    });

    return this.ensureRecord(updated, id);
  }

  async importMarkdown(markdown: string, type: ContentType): Promise<ContentRecord> {
    const document = parseMarkdownDocument(markdown);
    const title = String(document.frontmatter.title ?? 'Untitled');
    const slug = String(document.frontmatter.slug ?? this.slugify(title));
    const summary = String(document.frontmatter.summary ?? '');
    const visibility = document.frontmatter.visibility === 'private' ? 'private' : 'public';
    const categories = normalizeTaxonomyLabels(toStringArray(document.frontmatter.categories));
    const tags = normalizeTaxonomyLabels(toStringArray(document.frontmatter.tags));

    const record = await this.createDraft({
      type,
      title,
      slug,
      summary,
      bodyMarkdown: document.body,
      categories,
      tags,
    });

    return this.setVisibility(record.id, visibility);
  }

  async exportMarkdown(id: string): Promise<string> {
    const record = await this.getRecord(id);

    return serializeMarkdownDocument({
      frontmatter: {
        title: record.title,
        slug: record.slug,
        summary: record.summary,
        type: record.type,
        status: record.status,
        visibility: record.visibility,
        categories: record.categories,
        tags: record.tags,
        publishedAt: record.publishedAt,
        updatedAt: record.updatedAt,
      },
      body: record.bodyMarkdown,
    });
  }

  private async getRecord(id: string): Promise<ContentRecord> {
    return this.ensureRecord(await this.repository.findById(id), id);
  }

  private ensureRecord(record: ContentRecord | null, id: string): ContentRecord {
    if (record) {
      return record;
    }

    throw new NotFoundException(`Content ${id} was not found`);
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === 'string') {
    return value.split(',');
  }

  return [];
}

function normalizeTaxonomyLabels(labels: string[] | undefined): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const label of labels ?? []) {
    const next = label.trim();
    const key = next.toLowerCase();

    if (next && !seen.has(key)) {
      normalized.push(next);
      seen.add(key);
    }
  }

  return normalized;
}
