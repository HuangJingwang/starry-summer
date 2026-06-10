import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface UploadValidationInput {
  mimeType: string;
  byteSize: number;
  bytes?: Buffer;
}

export interface SaveAssetInput {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}

export interface StoredAsset {
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  byteSize: number;
}

export interface AssetStorage {
  save(input: SaveAssetInput): Promise<StoredAsset>;
  delete(storageKey: string): Promise<void>;
}

export interface S3AssetStorageOptions {
  bucket: string;
  publicBaseUrl: string;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  now?: () => Date;
  randomId?: () => string;
  send?: (command: DeleteObjectCommand | PutObjectCommand) => Promise<unknown>;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/markdown',
]);
const safeExtensionsByMimeType = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['application/pdf', '.pdf'],
  ['text/plain', '.txt'],
  ['text/markdown', '.md'],
]);

export function assertAllowedUpload(input: UploadValidationInput): void {
  if (!allowedMimeTypes.has(input.mimeType)) {
    throw new BadRequestException(`Unsupported upload type: ${input.mimeType}`);
  }

  if (input.byteSize <= 0) {
    throw new BadRequestException('Upload is empty');
  }

  if (input.byteSize > MAX_UPLOAD_BYTES) {
    throw new BadRequestException(`Upload exceeds ${MAX_UPLOAD_BYTES} bytes`);
  }

  if (input.bytes && !contentMatchesDeclaredType(input.mimeType, input.bytes)) {
    throw new BadRequestException(`Upload content does not match declared type: ${input.mimeType}`);
  }
}

export class LocalAssetStorage implements AssetStorage {
  constructor(
    private readonly options: {
      uploadDir: string;
      publicBaseUrl: string;
      now?: () => Date;
      randomId?: () => string;
    },
  ) {}

  async save(input: SaveAssetInput): Promise<StoredAsset> {
    assertAllowedUpload({
      mimeType: input.mimeType,
      byteSize: input.bytes.byteLength,
      bytes: input.bytes,
    });

    const storageKey = createStorageKey(
      input.filename,
      this.options.now?.() ?? new Date(),
      this.options.randomId,
      safeExtensionForMimeType(input.mimeType),
    );
    const destination = join(this.options.uploadDir, storageKey);

    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, input.bytes);

    return {
      storageKey,
      publicUrl: `${this.options.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`,
      mimeType: input.mimeType,
      byteSize: input.bytes.byteLength,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const target = resolve(this.options.uploadDir, storageKey);
    const root = resolve(this.options.uploadDir);

    if (target !== root && !target.startsWith(`${root}${sep}`)) {
      throw new Error('Unsafe storage key');
    }

    await rm(target, { force: true });
  }
}

export class S3AssetStorage implements AssetStorage {
  private readonly sendCommand: (command: DeleteObjectCommand | PutObjectCommand) => Promise<unknown>;

  constructor(private readonly options: S3AssetStorageOptions) {
    if (options.send) {
      this.sendCommand = options.send;
      return;
    }

    const client = new S3Client({
      endpoint: options.endpoint,
      region: options.region ?? 'us-east-1',
      forcePathStyle: options.forcePathStyle ?? true,
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
            }
          : undefined,
    });

    this.sendCommand = (command) => client.send(command);
  }

  async save(input: SaveAssetInput): Promise<StoredAsset> {
    assertAllowedUpload({
      mimeType: input.mimeType,
      byteSize: input.bytes.byteLength,
      bytes: input.bytes,
    });

    const storageKey = createStorageKey(
      input.filename,
      this.options.now?.() ?? new Date(),
      this.options.randomId,
      safeExtensionForMimeType(input.mimeType),
    );

    await this.sendCommand(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: storageKey,
        Body: input.bytes,
        ContentType: input.mimeType,
      }),
    );

    return {
      storageKey,
      publicUrl: `${this.options.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`,
      mimeType: input.mimeType,
      byteSize: input.bytes.byteLength,
    };
  }

  async delete(storageKey: string): Promise<void> {
    await this.sendCommand(
      new DeleteObjectCommand({
        Bucket: this.options.bucket,
        Key: storageKey,
      }),
    );
  }
}

function createStorageKey(filename: string, now: Date, randomId: (() => string) | undefined, ext: string): string {
  const originalExt = extname(filename);
  const name = basename(filename, originalExt)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const safeName = name || 'asset';
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const suffix = normalizeStorageKeySuffix(randomId?.() ?? randomUUID().slice(0, 8));

  return `${year}/${month}/${day}/${safeName}-${suffix}${ext}`;
}

function normalizeStorageKeySuffix(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16) || randomUUID().replace(/-/g, '').slice(0, 8);
}

function safeExtensionForMimeType(mimeType: string): string {
  return safeExtensionsByMimeType.get(mimeType) ?? '.bin';
}

function contentMatchesDeclaredType(mimeType: string, bytes: Buffer): boolean {
  if (mimeType === 'image/png') {
    return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (mimeType === 'image/jpeg') {
    return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
  }

  if (mimeType === 'image/gif') {
    return bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a';
  }

  if (mimeType === 'image/webp') {
    return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  if (mimeType === 'application/pdf') {
    return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  return true;
}

function startsWithBytes(bytes: Buffer, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}
