import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface UploadValidationInput {
  mimeType: string;
  byteSize: number;
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

export function assertAllowedUpload(input: UploadValidationInput): void {
  if (!allowedMimeTypes.has(input.mimeType)) {
    throw new Error(`Unsupported upload type: ${input.mimeType}`);
  }

  if (input.byteSize <= 0) {
    throw new Error('Upload is empty');
  }

  if (input.byteSize > MAX_UPLOAD_BYTES) {
    throw new Error(`Upload exceeds ${MAX_UPLOAD_BYTES} bytes`);
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
    });

    const storageKey = this.createStorageKey(input.filename);
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

  private createStorageKey(filename: string): string {
    return createStorageKey(filename, this.options.now?.() ?? new Date(), this.options.randomId);
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
    });

    const storageKey = createStorageKey(input.filename, this.options.now?.() ?? new Date(), this.options.randomId);

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

function createStorageKey(filename: string, now: Date, randomId: (() => string) | undefined): string {
  const originalExt = extname(filename);
  const ext = originalExt.toLowerCase();
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
