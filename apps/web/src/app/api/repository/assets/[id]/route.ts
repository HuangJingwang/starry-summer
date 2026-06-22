import { NextResponse } from 'next/server';

import {
  createGitHubContentCommit,
  getGitHubRepositoryConfig,
  readGitHubTextFile,
} from '@/lib/github-content-commit';
import { isRepositoryRouteAuthorized } from '@/lib/repository-route-auth';
import {
  parseRepositoryAssetsIndex,
  removeRepositoryAssetIndexItem,
} from '@/lib/repository-assets-publish';

export const runtime = 'nodejs';

const repositoryAssetsIndexPath = 'apps/web/content/assets.json';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const config = getGitHubRepositoryConfig();

  if (!config) {
    return NextResponse.json({ message: 'GitHub repository asset publishing is not configured.' }, { status: 501 });
  }

  if (!isRepositoryRouteAuthorized({ cookieHeader: request.headers.get('cookie'), headers: request.headers })) {
    return NextResponse.json({ message: 'Repository asset publishing is not authorized.' }, { status: 403 });
  }

  const { id } = await context.params;
  const currentAssets = await readCurrentRepositoryAssets();
  const { removed, files } = removeRepositoryAssetIndexItem(currentAssets, id);

  if (!removed) {
    return NextResponse.json({ message: 'Repository asset not found.' }, { status: 404 });
  }

  const result = await createGitHubContentCommit(
    {
      message: `assets: remove ${removed.storageKey}`,
      files,
    },
    config,
  );

  return NextResponse.json({
    id: removed.id,
    commitSha: result.sha,
    commitUrl: result.url,
  });
}

async function readCurrentRepositoryAssets() {
  try {
    const config = getGitHubRepositoryConfig();

    if (!config) {
      return [];
    }

    return parseRepositoryAssetsIndex(await readGitHubTextFile(config, repositoryAssetsIndexPath));
  } catch {
    return [];
  }
}
