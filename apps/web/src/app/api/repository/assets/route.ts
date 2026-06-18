import { NextResponse } from 'next/server';

import {
  createGitHubContentCommit,
  getGitHubRepositoryConfig,
  readGitHubTextFile,
} from '@/lib/github-content-commit';
import { isRepositoryRouteAuthorized } from '@/lib/repository-route-auth';
import {
  buildRepositoryAssetUploadFiles,
  parseRepositoryAssetsIndex,
  type RepositoryAssetUploadPayload,
} from '@/lib/repository-assets-publish';
import type { AssetUsage, StoredAsset } from '@/lib/assets';
import { readRepositoryAssetsFile } from '@/lib/assets-repository';

export const runtime = 'nodejs';

const repositoryAssetsIndexPath = 'apps/web/content/assets.json';

export async function GET(request: Request) {
  const usage = new URL(request.url).searchParams.get('usage') as AssetUsage | null;
  const assets = await readCurrentRepositoryAssets();

  return NextResponse.json(filterAssets(assets, usage ?? undefined));
}

export async function POST(request: Request) {
  const config = getGitHubRepositoryConfig();

  if (!config) {
    return NextResponse.json({ message: 'GitHub repository asset publishing is not configured.' }, { status: 501 });
  }

  if (!isRepositoryRouteAuthorized({ cookieHeader: request.headers.get('cookie'), headers: request.headers })) {
    return NextResponse.json({ message: 'Repository asset publishing is not authorized.' }, { status: 403 });
  }

  const payload = (await request.json()) as Partial<RepositoryAssetUploadPayload>;

  if (!isRepositoryAssetUploadPayload(payload)) {
    return NextResponse.json({ message: 'Invalid repository asset upload payload.' }, { status: 400 });
  }

  const currentAssets = await readCurrentRepositoryAssets();
  const { asset, files } = buildRepositoryAssetUploadFiles(payload, currentAssets);
  const result = await createGitHubContentCommit(
    {
      message: `assets: upload ${asset.storageKey}`,
      files,
    },
    config,
  );

  return NextResponse.json({
    ...asset,
    commitSha: result.sha,
    commitUrl: result.url,
  });
}

async function readCurrentRepositoryAssets(): Promise<StoredAsset[]> {
  const config = getGitHubRepositoryConfig();

  if (config) {
    try {
      return parseRepositoryAssetsIndex(await readGitHubTextFile(config, repositoryAssetsIndexPath));
    } catch {
      return [];
    }
  }

  try {
    return readRepositoryAssetsFile();
  } catch {
    return [];
  }
}

function filterAssets(assets: StoredAsset[], usage?: AssetUsage): StoredAsset[] {
  const filtered = usage ? assets.filter((asset) => asset.usage === usage) : assets;

  return filtered.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function isRepositoryAssetUploadPayload(payload: Partial<RepositoryAssetUploadPayload>): payload is RepositoryAssetUploadPayload {
  return Boolean(
    payload.filename &&
    payload.mimeType &&
    typeof payload.base64 === 'string' &&
    (!payload.usage || ['content', 'cover', 'background', 'attachment'].includes(payload.usage)) &&
    (!payload.altText || typeof payload.altText === 'string'),
  );
}
