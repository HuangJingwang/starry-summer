import type { GitHubCommitFile } from './github-content-commit';
import { normalizeStoredAsset, type AssetUploadPayload, type AssetUsage, type StoredAsset } from './assets';

export type RepositoryAssetUploadPayload = AssetUploadPayload;

export interface RepositoryAssetPublishOptions {
  now?: Date;
}

export interface RepositoryAssetUploadResult {
  asset: StoredAsset;
  files: GitHubCommitFile[];
}

export interface RepositoryAssetDeleteResult {
  removed: StoredAsset | null;
  assets: StoredAsset[];
  files: GitHubCommitFile[];
}

const repositoryAssetsIndexPath = 'apps/web/content/assets.json';
const repositoryPublicImagePrefix = 'apps/web/public/';
const validAssetUsages = new Set<AssetUsage>(['content', 'cover', 'background', 'attachment']);

export function buildRepositoryAssetUploadFiles(
  payload: RepositoryAssetUploadPayload,
  existingAssets: StoredAsset[],
  options: RepositoryAssetPublishOptions = {},
): RepositoryAssetUploadResult {
  const now = options.now ?? new Date();
  const createdAt = now.toISOString();
  const timestamp = formatTimestamp(now);
  const filename = `${timestamp}-${slugifyFilename(payload.filename)}`;
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const storageKey = `images/uploads/${year}/${month}/${filename}`;
  const asset = normalizeStoredAsset({
    id: `asset-${filename}`,
    storageKey,
    publicUrl: `/${storageKey}`,
    mimeType: payload.mimeType,
    byteSize: Buffer.from(payload.base64, 'base64').byteLength,
    usage: validAssetUsages.has(payload.usage ?? 'content') ? payload.usage : 'content',
    altText: payload.altText ?? '',
    createdAt,
  });
  const assets = [asset, ...existingAssets.filter((item) => item.id !== asset.id && item.storageKey !== asset.storageKey)];

  return {
    asset,
    files: [
      {
        path: `${repositoryPublicImagePrefix}${storageKey}`,
        content: payload.base64,
        encoding: 'base64',
      },
      buildRepositoryAssetsIndexFile(assets),
    ],
  };
}

export function removeRepositoryAssetIndexItem(existingAssets: StoredAsset[], id: string): RepositoryAssetDeleteResult {
  const removed = existingAssets.find((asset) => asset.id === id) ?? null;
  const assets = existingAssets.filter((asset) => asset.id !== id);

  return {
    removed,
    assets,
    files: [buildRepositoryAssetsIndexFile(assets)],
  };
}

export function parseRepositoryAssetsIndex(input: string): StoredAsset[] {
  const parsed = JSON.parse(input) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map((item) => normalizeStoredAsset(item as Partial<StoredAsset>));
}

function buildRepositoryAssetsIndexFile(assets: StoredAsset[]): GitHubCommitFile {
  return {
    path: repositoryAssetsIndexPath,
    content: `${JSON.stringify(assets, null, 2)}\n`,
  };
}

function formatTimestamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hour}${minute}${second}`;
}

function slugifyFilename(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const extension = trimmed.match(/\.[a-z0-9]+$/)?.[0] ?? '';
  const basename = trimmed.slice(0, extension ? -extension.length : undefined);
  const slug = basename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${slug || 'asset'}${extension || '.bin'}`;
}
