import type { ContentRecord, PublicContentFilter } from './content.service';

export type CreateContentRecordInput = Omit<ContentRecord, 'createdAt' | 'id' | 'updatedAt'>;

export interface ContentRepository {
  create(input: CreateContentRecordInput): Promise<ContentRecord>;
  findById(id: string): Promise<ContentRecord | null>;
  findBySlug(slug: string): Promise<ContentRecord | null>;
  listAdmin(): Promise<ContentRecord[]>;
  listPublic(filter?: PublicContentFilter): Promise<ContentRecord[]>;
  update(id: string, patch: Partial<ContentRecord>): Promise<ContentRecord | null>;
  delete(id: string): Promise<boolean>;
}

export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY');

export class InMemoryContentRepository implements ContentRepository {
  private readonly records = new Map<string, ContentRecord>();
  private nextId = 1;

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  async create(input: CreateContentRecordInput): Promise<ContentRecord> {
    const now = this.now();
    const record: ContentRecord = {
      ...input,
      categories: [...input.categories],
      tags: [...input.tags],
      id: String(this.nextId++),
      createdAt: now,
      updatedAt: now,
    };

    this.records.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<ContentRecord | null> {
    return this.records.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<ContentRecord | null> {
    return [...this.records.values()].find((record) => record.slug === slug) ?? null;
  }

  async listAdmin(): Promise<ContentRecord[]> {
    return [...this.records.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listPublic(filter: PublicContentFilter = {}): Promise<ContentRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.status === 'published' && record.visibility === 'public')
      .filter((record) => (filter.type ? record.type === filter.type : true))
      .sort((a, b) => sortPublicContent(a, b, filter.sort ?? 'latest'));
  }

  async update(id: string, patch: Partial<ContentRecord>): Promise<ContentRecord | null> {
    const record = this.records.get(id);

    if (!record) {
      return null;
    }

    const updated = {
      ...record,
      ...patch,
      categories: patch.categories ? [...patch.categories] : record.categories,
      tags: patch.tags ? [...patch.tags] : record.tags,
      id: record.id,
      updatedAt: patch.updatedAt ?? this.now(),
    };
    this.records.set(id, updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }
}

function sortPublicContent(a: ContentRecord, b: ContentRecord, sort: NonNullable<PublicContentFilter['sort']>): number {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1;
  }

  if (sort === 'popular') {
    const viewOrder = b.viewCount - a.viewCount;

    if (viewOrder !== 0) {
      return viewOrder;
    }

    const likeOrder = b.likeCount - a.likeCount;

    if (likeOrder !== 0) {
      return likeOrder;
    }
  }

  return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
}
