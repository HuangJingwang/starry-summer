import type { ContentRecord, PublicContentFilter } from './content.service';

export type CreateContentRecordInput = Omit<ContentRecord, 'createdAt' | 'id' | 'updatedAt'>;

export interface ContentRepository {
  create(input: CreateContentRecordInput): Promise<ContentRecord>;
  findById(id: string): Promise<ContentRecord | null>;
  listAdmin(): Promise<ContentRecord[]>;
  listPublic(filter?: PublicContentFilter): Promise<ContentRecord[]>;
  update(id: string, patch: Partial<ContentRecord>): Promise<ContentRecord | null>;
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

  async listAdmin(): Promise<ContentRecord[]> {
    return [...this.records.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listPublic(filter: PublicContentFilter = {}): Promise<ContentRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.status === 'published' && record.visibility === 'public')
      .filter((record) => (filter.type ? record.type === filter.type : true))
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  }

  async update(id: string, patch: Partial<ContentRecord>): Promise<ContentRecord | null> {
    const record = this.records.get(id);

    if (!record) {
      return null;
    }

    const updated = {
      ...record,
      ...patch,
      id: record.id,
      updatedAt: patch.updatedAt ?? this.now(),
    };
    this.records.set(id, updated);

    return updated;
  }
}
