import type { StoredAsset } from './storage.service.js';

export type AssetUsage = 'content' | 'cover' | 'background' | 'attachment';

export interface AssetRecord extends StoredAsset {
  id: string;
  usage: AssetUsage;
  altText: string;
  createdAt: string;
}

export interface CreateAssetRecordInput extends StoredAsset {
  usage: AssetUsage;
  altText: string;
}

export interface AssetListFilter {
  usage?: AssetUsage;
}

export interface AssetRepository {
  create(input: CreateAssetRecordInput): Promise<AssetRecord>;
  findById(id: string): Promise<AssetRecord | null>;
  list(filter?: AssetListFilter): Promise<AssetRecord[]>;
  delete(id: string): Promise<boolean>;
}

export const ASSET_REPOSITORY = Symbol('ASSET_REPOSITORY');

export class InMemoryAssetRepository implements AssetRepository {
  private readonly records = new Map<string, AssetRecord>();
  private nextId = 1;

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  async create(input: CreateAssetRecordInput): Promise<AssetRecord> {
    const record: AssetRecord = {
      ...input,
      id: String(this.nextId++),
      createdAt: this.now(),
    };

    this.records.set(record.id, record);

    return record;
  }

  async findById(id: string): Promise<AssetRecord | null> {
    return this.records.get(id) ?? null;
  }

  async list(filter: AssetListFilter = {}): Promise<AssetRecord[]> {
    return [...this.records.values()]
      .filter((record) => (filter.usage ? record.usage === filter.usage : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }
}

const assetUsages = new Set<AssetUsage>(['content', 'cover', 'background', 'attachment']);

export function normalizeAssetUsage(value: unknown): AssetUsage {
  return assetUsages.has(value as AssetUsage) ? (value as AssetUsage) : 'content';
}
