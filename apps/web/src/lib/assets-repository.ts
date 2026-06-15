import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { normalizeStoredAsset, type AssetUsage, type StoredAsset } from './assets';

const defaultRepositoryAssetsPath = join(process.cwd(), 'content', 'assets.json');
const validAssetUsages = new Set<AssetUsage>(['content', 'cover', 'background', 'attachment']);

export interface RepositoryAssetsLoadOptions {
  assetsFilePath?: string;
  usage?: AssetUsage;
}

export interface RepositoryAssetsLoadResult {
  source: 'repository-file' | 'fallback';
  assets: StoredAsset[];
}

export function readRepositoryAssetsFile(assetsFilePath = defaultRepositoryAssetsPath): StoredAsset[] {
  const data = JSON.parse(readFileSync(assetsFilePath, 'utf8')) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('Repository assets file must contain an array.');
  }

  return data.map((item) => normalizeRepositoryAsset(item as Partial<StoredAsset>));
}

export async function loadRepositoryAssets(options: RepositoryAssetsLoadOptions = {}): Promise<RepositoryAssetsLoadResult> {
  try {
    return {
      source: 'repository-file',
      assets: filterAssetsByUsage(readRepositoryAssetsFile(options.assetsFilePath), options.usage),
    };
  } catch {
    return {
      source: 'fallback',
      assets: [],
    };
  }
}

export async function loadRepositoryRandomAsset(options: RepositoryAssetsLoadOptions = {}): Promise<StoredAsset | null> {
  const { assets } = await loadRepositoryAssets(options);

  return assets[0] ?? null;
}

function normalizeRepositoryAsset(input: Partial<StoredAsset>): StoredAsset {
  const asset = normalizeStoredAsset(input);

  if (!validAssetUsages.has(asset.usage)) {
    return {
      ...asset,
      usage: 'content',
    };
  }

  return asset;
}

function filterAssetsByUsage(assets: StoredAsset[], usage?: AssetUsage): StoredAsset[] {
  const filtered = usage ? assets.filter((asset) => asset.usage === usage) : assets;

  return filtered.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
