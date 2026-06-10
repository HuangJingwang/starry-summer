import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { ContentStatus, ContentType, ContentVisibility } from '@starry-summer/shared';
import { canPublishContent, isPublicContent } from '@starry-summer/shared';

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
}

export interface PublicContentFilter {
  type?: ContentType;
}

@Injectable()
export class ContentService {
  private readonly records = new Map<string, ContentRecord>();
  private nextId = 1;

  async createDraft(input: CreateDraftInput): Promise<ContentRecord> {
    const now = new Date().toISOString();
    const record: ContentRecord = {
      id: String(this.nextId++),
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
      viewCount: 0,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    };

    this.records.set(record.id, record);
    return record;
  }

  async listAdmin(): Promise<ContentRecord[]> {
    return [...this.records.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listPublic(filter: PublicContentFilter = {}): Promise<ContentRecord[]> {
    return [...this.records.values()]
      .filter((record) => isPublicContent(record))
      .filter((record) => (filter.type ? record.type === filter.type : true))
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  }

  async publish(id: string): Promise<ContentRecord> {
    const record = this.getRecord(id);

    if (!canPublishContent(record)) {
      throw new UnprocessableEntityException('Content is not ready to publish');
    }

    const now = new Date().toISOString();
    const updated = {
      ...record,
      status: 'published' as const,
      updatedAt: now,
      publishedAt: record.publishedAt ?? now,
    };
    this.records.set(id, updated);

    return updated;
  }

  async setVisibility(id: string, visibility: ContentVisibility): Promise<ContentRecord> {
    const record = this.getRecord(id);
    const updated = {
      ...record,
      visibility,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(id, updated);

    return updated;
  }

  private getRecord(id: string): ContentRecord {
    const record = this.records.get(id);

    if (!record) {
      throw new NotFoundException(`Content ${id} was not found`);
    }

    return record;
  }
}
