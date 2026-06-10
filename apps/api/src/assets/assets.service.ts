import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { AssetStorage, StoredAsset } from './storage.service.js';
import { LocalAssetStorage, S3AssetStorage } from './storage.service.js';
import {
  ASSET_REPOSITORY,
  InMemoryAssetRepository,
  normalizeAssetUsage,
  type AssetListFilter,
  type AssetRecord,
  type AssetRepository,
  type AssetUsage,
} from './assets.repository.js';
import { PostgresAssetsRepository } from './postgres-assets.repository.js';

export const ASSET_STORAGE = Symbol('ASSET_STORAGE');

export interface UploadAssetInput {
  filename: string;
  mimeType: string;
  base64: string;
  usage?: AssetUsage;
  altText?: string;
}

@Injectable()
export class AssetsService {
  constructor(
    @Inject(ASSET_STORAGE)
    private readonly storage: AssetStorage,
    @Inject(ASSET_REPOSITORY)
    private readonly repository: AssetRepository,
    private readonly randomNumber: () => number = Math.random,
  ) {}

  async upload(input: UploadAssetInput): Promise<AssetRecord> {
    const bytes = decodeBase64Payload(input.base64);
    const stored = await this.storage.save({
      filename: input.filename,
      mimeType: input.mimeType,
      bytes,
    });

    return this.repository.create({
      ...stored,
      usage: normalizeAssetUsage(input.usage),
      altText: input.altText?.trim() ?? '',
    });
  }

  list(filter: AssetListFilter = {}): Promise<AssetRecord[]> {
    return this.repository.list(filter);
  }

  async randomAsset(filter: AssetListFilter = {}): Promise<AssetRecord | null> {
    const assets = await this.repository.list(filter);

    if (assets.length === 0) {
      return null;
    }

    const index = Math.min(assets.length - 1, Math.floor(this.randomNumber() * assets.length));

    return assets[index] ?? null;
  }

  random(filter: AssetListFilter = {}): Promise<AssetRecord | null> {
    return this.randomAsset(filter);
  }

  async delete(id: string): Promise<void> {
    const asset = await this.repository.findById(id);

    if (!asset) {
      throw new NotFoundException(`Asset ${id} was not found`);
    }

    await this.storage.delete(asset.storageKey);

    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Asset ${id} was not found`);
    }
  }
}

function decodeBase64Payload(value: string): Buffer {
  const normalized = value.replace(/\s+/g, '');

  if (!normalized || normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new BadRequestException('Asset upload payload must be valid base64');
  }

  return Buffer.from(normalized, 'base64');
}

export function createAssetStorage(): AssetStorage {
  const driver = process.env.STORAGE_DRIVER ?? 'local';

  if (driver === 's3') {
    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
      throw new Error('S3_BUCKET is required when STORAGE_DRIVER=s3');
    }

    const endpoint = process.env.S3_ENDPOINT;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL ?? buildS3PublicBaseUrl(endpoint, bucket);

    return new S3AssetStorage({
      bucket,
      endpoint,
      publicBaseUrl,
      region: process.env.S3_REGION ?? 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    });
  }

  if (driver !== 'local') {
    throw new Error(`Unsupported STORAGE_DRIVER "${driver}"`);
  }

  return new LocalAssetStorage({
    uploadDir: process.env.LOCAL_UPLOAD_DIR ?? './uploads',
    publicBaseUrl: process.env.LOCAL_UPLOAD_PUBLIC_URL ?? '/uploads',
  });
}

function buildS3PublicBaseUrl(endpoint: string | undefined, bucket: string): string {
  if (!endpoint) {
    return `https://${bucket}.s3.amazonaws.com`;
  }

  return `${endpoint.replace(/\/$/, '')}/${bucket}`;
}

export function createAssetRepository(): AssetRepository {
  const driver = process.env.CONTENT_REPOSITORY_DRIVER ?? 'memory';

  if (driver === 'postgres') {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when CONTENT_REPOSITORY_DRIVER=postgres');
    }

    return new PostgresAssetsRepository(databaseUrl);
  }

  return new InMemoryAssetRepository();
}
