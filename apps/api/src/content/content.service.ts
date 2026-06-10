import { ForbiddenException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { parseMarkdownDocument, serializeMarkdownDocument, type MarkdownFrontmatterValue } from '@starry-summer/markdown';
import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectLinks, ProjectMetadata, ProjectStatus } from '@starry-summer/shared';
import { canPublishContent } from '@starry-summer/shared';

import { CONTENT_REPOSITORY, type ContentRepository } from './content.repository.js';

export interface ContentRecord {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  bodyMarkdown: string;
  sourceType: ContentSourceType;
  sourceUrl: string;
  coverAssetId?: string;
  coverImageUrl?: string;
  coverAltText?: string;
  status: ContentStatus;
  visibility: ContentVisibility;
  allowComments: boolean;
  pinned: boolean;
  featured: boolean;
  viewCount: number;
  likeCount: number;
  categories: string[];
  tags: string[];
  series: string[];
  project?: ProjectMetadata;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CreateDraftInput {
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  bodyMarkdown: string;
  sourceType?: ContentSourceType;
  sourceUrl?: string;
  coverAssetId?: string;
  categories?: string[];
  tags?: string[];
  series?: string[];
  project?: ProjectMetadata;
}

export type UpdateContentInput = Partial<{
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  bodyMarkdown: string;
  sourceType: ContentSourceType;
  sourceUrl: string;
  coverAssetId: string;
  allowComments: boolean;
  pinned: boolean;
  featured: boolean;
  categories: string[];
  tags: string[];
  series: string[];
  project: ProjectMetadata;
}>;

export interface AdminContentFilter {
  type?: ContentType;
  status?: ContentStatus;
  query?: string;
  category?: string;
  tag?: string;
  series?: string;
}

export interface PublicContentFilter {
  type?: ContentType;
  sort?: PublicContentSort;
}

export type PublicContentSort = 'latest' | 'popular';

const contentTypes = new Set<ContentType>(['post', 'note', 'moment', 'page', 'project']);

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
      ...(input.seoTitle !== undefined ? { seoTitle: normalizeOptionalText(input.seoTitle) } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: normalizeOptionalText(input.seoDescription) } : {}),
      coverAssetId: input.coverAssetId !== undefined ? normalizeOptionalText(input.coverAssetId) : undefined,
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
    const document = parseMarkdownDocument(markdown);
    const title = String(document.frontmatter.title ?? 'Untitled');
    const slug = String(document.frontmatter.slug ?? this.slugify(title));
    const summary = String(document.frontmatter.summary ?? '');
    const seoTitle = normalizeOptionalText(String(document.frontmatter.seoTitle ?? ''));
    const seoDescription = normalizeOptionalText(String(document.frontmatter.seoDescription ?? ''));
    const visibility = document.frontmatter.visibility === 'private' ? 'private' : 'public';
    const sourceType = document.frontmatter.sourceType === 'repost' ? 'repost' : 'original';
    const sourceUrl = normalizeSourceUrl(String(document.frontmatter.sourceUrl ?? ''));
    const coverAssetId = normalizeOptionalText(String(document.frontmatter.coverAssetId ?? ''));
    const categories = normalizeTaxonomyLabels(toStringArray(document.frontmatter.categories));
    const tags = normalizeTaxonomyLabels(toStringArray(document.frontmatter.tags));
    const series = normalizeTaxonomyLabels(toStringArray(document.frontmatter.series));
    const allowComments = document.frontmatter.allowComments === false ? false : true;
    const featured = document.frontmatter.featured === true;
    const pinned = document.frontmatter.pinned === true;
    const project = normalizeProjectMetadata(document.frontmatter.project as unknown as ProjectMetadata | undefined);

    const record = await this.createDraft({
      type,
      title,
      slug,
      summary,
      seoTitle,
      seoDescription,
      bodyMarkdown: document.body,
      sourceType,
      sourceUrl,
      coverAssetId,
      categories,
      tags,
      series,
      project,
    });

    const updated = await this.updateContent(record.id, { allowComments, featured, pinned });

    if (updated.visibility === visibility) {
      return updated;
    }

    return this.setVisibility(record.id, visibility);
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

    return this.serializeRecordAsMarkdown(record);
  }

  async exportMarkdownArchive(): Promise<string> {
    const records = await this.repository.listAdmin();
    const sections = records.flatMap((record) => [
      `<!-- starry-summer:content ${record.type}/${record.slug} id=${record.id} -->`,
      this.serializeRecordAsMarkdown(record),
    ]);

    return ['# Starry Summer Markdown Export', '', ...sections].join('\n\n');
  }

  private serializeRecordAsMarkdown(record: ContentRecord): string {
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

function normalizeSourceUrl(value: string | undefined): string {
  return value?.trim() ?? '';
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
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

const projectStatuses = new Set<ProjectStatus>(['active', 'paused', 'completed', 'archived']);
const projectLinkKeys: Array<keyof ProjectLinks> = ['website', 'repository', 'demo', 'article'];
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function normalizeProjectMetadata(project: ProjectMetadata | undefined): ProjectMetadata | undefined {
  if (!project || typeof project !== 'object') {
    return undefined;
  }

  const normalized: ProjectMetadata = {};
  const status = normalizeProjectStatus(project.status);
  const links = normalizeProjectLinks(project.links);
  const stack = normalizeTaxonomyLabels(project.stack);
  const startedAt = normalizeDateOnly(project.startedAt);
  const endedAt = normalizeDateOnly(project.endedAt);

  if (status) {
    normalized.status = status;
  }

  if (links) {
    normalized.links = links;
  }

  if (stack.length > 0) {
    normalized.stack = stack;
  }

  if (startedAt) {
    normalized.startedAt = startedAt;
  }

  if (endedAt) {
    normalized.endedAt = endedAt;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeProjectStatus(status: ProjectMetadata['status']): ProjectStatus | undefined {
  return projectStatuses.has(status as ProjectStatus) ? status : undefined;
}

function normalizeProjectLinks(links: ProjectMetadata['links']): ProjectLinks | undefined {
  if (!links || typeof links !== 'object') {
    return undefined;
  }

  const normalized: ProjectLinks = {};

  for (const key of projectLinkKeys) {
    const value = links[key]?.trim();

    if (value) {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeDateOnly(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized && dateOnlyPattern.test(normalized) ? normalized : undefined;
}

function parseMarkdownArchiveSections(markdown: string): Array<{ type: ContentType; markdown: string }> {
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

function parseContentType(value: string | undefined): ContentType {
  if (contentTypes.has(value as ContentType)) {
    return value as ContentType;
  }

  return 'post';
}
