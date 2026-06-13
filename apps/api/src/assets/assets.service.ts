import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';

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

export interface OptimizableAssetUpload {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}

export type AssetUploadOptimizer = (input: OptimizableAssetUpload) => Promise<OptimizableAssetUpload>;

@Injectable()
export class AssetsService {
  constructor(
    @Inject(ASSET_STORAGE)
    private readonly storage: AssetStorage,
    @Inject(ASSET_REPOSITORY)
    private readonly repository: AssetRepository,
    private readonly randomNumber: () => number = Math.random,
    private readonly optimizeUpload: AssetUploadOptimizer = optimizeAssetUpload,
  ) {}

  async upload(input: UploadAssetInput): Promise<AssetRecord> {
    assertUploadInput(input);
    const bytes = decodeBase64Payload(input.base64);
    const optimized = await this.optimizeUpload({
      filename: input.filename,
      mimeType: normalizeUploadMimeType(input.mimeType, input.filename),
      bytes,
    });
    const stored = await this.storage.save(optimized);

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

const optimizedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_OPTIMIZED_IMAGE_DIMENSION = 1920;
const WEBP_QUALITY = 82;

export async function optimizeAssetUpload(input: OptimizableAssetUpload): Promise<OptimizableAssetUpload> {
  if (!optimizedImageMimeTypes.has(input.mimeType)) {
    return input;
  }

  let output: Buffer;

  try {
    output = await sharp(input.bytes, { failOn: 'error' })
      .rotate()
      .resize({
        width: MAX_OPTIMIZED_IMAGE_DIMENSION,
        height: MAX_OPTIMIZED_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: WEBP_QUALITY,
        effort: 4,
      })
      .toBuffer();
  } catch {
    return input;
  }

  if (output.byteLength >= input.bytes.byteLength) {
    return input;
  }

  return {
    filename: replaceFilenameExtension(input.filename, '.webp'),
    mimeType: 'image/webp',
    bytes: output,
  };
}

function assertUploadInput(input: UploadAssetInput): void {
  if (
    typeof input?.filename !== 'string' ||
    typeof input.mimeType !== 'string' ||
    typeof input.base64 !== 'string'
  ) {
    throw new BadRequestException('Asset upload filename, mimeType, and base64 must be strings');
  }
}

function normalizeUploadMimeType(mimeType: string, filename: string): string {
  const normalized = mimeType.trim().toLowerCase();

  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }

  if (normalized && normalized !== 'application/octet-stream') {
    return normalized;
  }

  const extension = filename.split('.').pop()?.toLowerCase();

  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg';
  }

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  if (extension === 'gif') {
    return 'image/gif';
  }

  if (extension === 'pdf') {
    return 'application/pdf';
  }

  if (extension === 'md' || extension === 'markdown') {
    return 'text/markdown';
  }

  if (extension === 'txt') {
    return 'text/plain';
  }

  return normalized;
}

function decodeBase64Payload(value: string): Buffer {
  const normalized = value.replace(/\s+/g, '');

  if (!normalized || normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new BadRequestException('Asset upload payload must be valid base64');
  }

  return Buffer.from(normalized, 'base64');
}

function replaceFilenameExtension(filename: string, extension: string): string {
  const index = filename.lastIndexOf('.');

  return `${index > 0 ? filename.slice(0, index) : filename}${extension}`;
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
