import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
  send?: (command: PutObjectCommand) => Promise<unknown>;
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

  private createStorageKey(filename: string): string {
    return createStorageKey(filename, this.options.now?.() ?? new Date());
  }
}

export class S3AssetStorage implements AssetStorage {
  private readonly sendCommand: (command: PutObjectCommand) => Promise<unknown>;

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

    const storageKey = createStorageKey(input.filename, this.options.now?.() ?? new Date());

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
}

function createStorageKey(filename: string, now: Date): string {
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

  return `${year}/${month}/${day}/${safeName}${ext}`;
}
