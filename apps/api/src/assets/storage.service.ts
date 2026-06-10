import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';

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
    const now = this.options.now?.() ?? new Date();
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
}
