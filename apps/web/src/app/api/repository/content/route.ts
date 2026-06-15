import { NextResponse } from 'next/server';

import {
  createGitHubContentCommit,
  getGitHubRepositoryConfig,
  readGitHubTextFile,
} from '@/lib/github-content-commit';
import {
  mergePublicContentIndex,
  type RepositoryContentPublishPayload,
} from '@/lib/repository-content-publish';
import { isRepositoryRouteAuthorized } from '@/lib/repository-route-auth';
import type { SiteContentItem } from '@/lib/content';

export const runtime = 'nodejs';

const publicContentIndexPath = 'apps/web/content/public-content.json';

export async function POST(request: Request) {
  const config = getGitHubRepositoryConfig();

  if (!config) {
    return NextResponse.json({ message: 'GitHub repository publishing is not configured.' }, { status: 501 });
  }

  if (!isRepositoryRouteAuthorized({ cookieHeader: request.headers.get('cookie'), headers: request.headers })) {
    return NextResponse.json({ message: 'Repository publishing is not authorized.' }, { status: 403 });
  }

  const payload = (await request.json()) as Partial<RepositoryContentPublishPayload>;

  if (!isRepositoryContentPublishPayload(payload)) {
    return NextResponse.json({ message: 'Invalid repository content publish payload.' }, { status: 400 });
  }

  const currentIndex = await readCurrentPublicContentIndex(config);
  const nextIndex = mergePublicContentIndex(currentIndex, payload.content);
  const files = [
    ...payload.files,
    {
      path: publicContentIndexPath,
      content: `${JSON.stringify(nextIndex, null, 2)}\n`,
    },
  ];
  const result = await createGitHubContentCommit(
    {
      message: `content: ${payload.action} ${payload.content.slug ?? payload.content.id}`,
      files,
    },
    config,
  );

  return NextResponse.json({
    id: payload.content.id,
    commitSha: result.sha,
    commitUrl: result.url,
  });
}

async function readCurrentPublicContentIndex(config: NonNullable<ReturnType<typeof getGitHubRepositoryConfig>>): Promise<SiteContentItem[]> {
  try {
    const content = await readGitHubTextFile(config, publicContentIndexPath);
    const parsed = JSON.parse(content) as unknown;

    return Array.isArray(parsed) ? (parsed as SiteContentItem[]) : [];
  } catch {
    return [];
  }
}

function isRepositoryContentPublishPayload(payload: Partial<RepositoryContentPublishPayload>): payload is RepositoryContentPublishPayload {
  return Boolean(
    payload.action &&
    payload.content?.id &&
    payload.content.title &&
    payload.content.type &&
    payload.content.status &&
    payload.content.visibility &&
    Array.isArray(payload.files) &&
    payload.files.every((file) => file.path && typeof file.content === 'string'),
  );
}
