import { Inject, Injectable } from '@nestjs/common';

import type { AssetStorage, StoredAsset } from './storage.service.js';
import { LocalAssetStorage } from './storage.service.js';

export const ASSET_STORAGE = Symbol('ASSET_STORAGE');

export interface UploadAssetInput {
  filename: string;
  mimeType: string;
  base64: string;
}

@Injectable()
export class AssetsService {
  constructor(
    @Inject(ASSET_STORAGE)
    private readonly storage: AssetStorage,
  ) {}

  upload(input: UploadAssetInput): Promise<StoredAsset> {
    return this.storage.save({
      filename: input.filename,
      mimeType: input.mimeType,
      bytes: Buffer.from(input.base64, 'base64'),
    });
  }
}

export function createAssetStorage(): AssetStorage {
  const driver = process.env.STORAGE_DRIVER ?? 'local';

  if (driver !== 'local') {
    throw new Error(`Unsupported STORAGE_DRIVER "${driver}". Use "local" until S3 storage is implemented.`);
  }

  return new LocalAssetStorage({
    uploadDir: process.env.LOCAL_UPLOAD_DIR ?? './uploads',
    publicBaseUrl: process.env.LOCAL_UPLOAD_PUBLIC_URL ?? '/uploads',
  });
}
