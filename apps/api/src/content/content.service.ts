import { ForbiddenException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { ContentType, ContentVisibility } from '@starry-summer/shared';
import { canPublishContent } from '@starry-summer/shared';

import { parseMarkdownArchiveSections, parseMarkdownImport, serializeRecordAsMarkdown } from './content-markdown.js';
import { normalizeNullableOptionalText, normalizeOptionalText, normalizeProjectMetadata, normalizeSourceUrl, normalizeTaxonomyLabels } from './content-normalization.js';
import { CONTENT_REPOSITORY, type ContentRepository } from './content.repository.js';
import type { AdminContentFilter, ContentRecord, CreateDraftInput, PublicContentFilter, UpdateContentInput } from './content.types.js';

@Injectable()
export class ContentService {
  constructor(
    @Inject(CONTENT_REPOSITORY)
    private readonly repository: ContentRepository,
  ) {}

  async createDraft(input: CreateDraftInput): Promise<ContentRecord> {
    await this.ensureSlugAvailable(input.slug);

    return this.repository.create({
      type: input.type,
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      seoTitle: normalizeOptionalText(input.seoTitle),
      seoDescription: normalizeOptionalText(input.seoDescription),
      bodyMarkdown: input.bodyMarkdown,
      sourceType: input.sourceType ?? 'original',
      sourceUrl: normalizeSourceUrl(input.sourceUrl),
      coverAssetId: normalizeOptionalText(input.coverAssetId),
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: normalizeTaxonomyLabels(input.categories),
      tags: normalizeTaxonomyLabels(input.tags),
      series: normalizeTaxonomyLabels(input.series),
      project: normalizeProjectMetadata(input.project),
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });
  }

  async listAdmin(filter: AdminContentFilter = {}): Promise<ContentRecord[]> {
    return this.repository.listAdmin(filter);
  }

  async getAdminRecord(id: string): Promise<ContentRecord> {
    return this.getRecord(id);
  }

  async listPublic(filter: PublicContentFilter = {}): Promise<ContentRecord[]> {
    return this.repository.listPublic(filter);
  }

  async ensureCanComment(targetType: Extract<ContentType, 'post' | 'note' | 'project'>, targetId: string): Promise<void> {
    const record = await this.repository.findById(targetId);

    if (
      !record ||
      record.type !== targetType ||
      record.status !== 'published' ||
      record.visibility !== 'public'
    ) {
      throw new NotFoundException(`Content ${targetId} was not found`);
    }

    if (!record.allowComments) {
      throw new ForbiddenException('Comments are disabled for this content');
    }
  }

  async updateContent(id: string, input: UpdateContentInput): Promise<ContentRecord> {
    await this.getRecord(id);

    if (input.slug) {
      await this.ensureSlugAvailable(input.slug, id);
    }

    const updated = await this.repository.update(id, {
      ...input,
      categories: input.categories ? normalizeTaxonomyLabels(input.categories) : undefined,
      tags: input.tags ? normalizeTaxonomyLabels(input.tags) : undefined,
      series: input.series ? normalizeTaxonomyLabels(input.series) : undefined,
      ...(input.seoTitle !== undefined ? { seoTitle: normalizeNullableOptionalText(input.seoTitle) } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: normalizeNullableOptionalText(input.seoDescription) } : {}),
      coverAssetId: input.coverAssetId !== undefined ? normalizeNullableOptionalText(input.coverAssetId) : undefined,
      project: input.project !== undefined ? normalizeProjectMetadata(input.project) ?? {} : undefined,
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

  async deleteArchived(id: string): Promise<void> {
    const record = await this.getRecord(id);

    if (record.status !== 'archived') {
      throw new UnprocessableEntityException('Only archived content can be permanently deleted');
    }

    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Content ${id} was not found`);
    }
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
    const imported = parseMarkdownImport(markdown, type);
    const record = await this.createDraft(imported.draft);
    const updated = await this.updateContent(record.id, {
      allowComments: imported.allowComments,
      featured: imported.featured,
      pinned: imported.pinned,
    });

    if (updated.visibility === imported.visibility) {
      return updated;
    }

    return this.setVisibility(record.id, imported.visibility);
  }

  async importMarkdownArchive(markdown: string): Promise<ContentRecord[]> {
    const sections = parseMarkdownArchiveSections(markdown);
    const imported: ContentRecord[] = [];

    for (const section of sections) {
      imported.push(await this.importMarkdown(section.markdown, section.type));
    }

    return imported;
  }

  async exportMarkdown(id: string): Promise<string> {
    const record = await this.getRecord(id);

    return serializeRecordAsMarkdown(record);
  }

  async exportMarkdownArchive(): Promise<string> {
    const records = await this.repository.listAdmin();
    const sections = records.flatMap((record) => [
      `<!-- starry-summer:content ${record.type}/${record.slug} id=${record.id} -->`,
      serializeRecordAsMarkdown(record),
    ]);

    return ['# Starry Summer Markdown Export', '', ...sections].join('\n\n');
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

  private async ensureSlugAvailable(slug: string, currentId?: string): Promise<void> {
    const existing = await this.repository.findBySlug(slug);

    if (existing && existing.id !== currentId) {
      throw new UnprocessableEntityException('Content slug is already in use');
    }
  }

}
