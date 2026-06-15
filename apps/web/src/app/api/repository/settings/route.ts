import { NextResponse } from 'next/server';

import {
  createGitHubContentCommit,
  getGitHubRepositoryConfig,
} from '@/lib/github-content-commit';
import { isRepositoryRouteAuthorized } from '@/lib/repository-route-auth';
import {
  normalizeSiteSettings,
  type RepositorySettingsPublishPayload,
} from '@/lib/settings';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const config = getGitHubRepositoryConfig();

  if (!config) {
    return NextResponse.json({ message: 'GitHub repository publishing is not configured.' }, { status: 501 });
  }

  if (!isRepositoryRouteAuthorized({ cookieHeader: request.headers.get('cookie'), headers: request.headers })) {
    return NextResponse.json({ message: 'Repository publishing is not authorized.' }, { status: 403 });
  }

  const payload = (await request.json()) as Partial<RepositorySettingsPublishPayload>;

  if (!isRepositorySettingsPublishPayload(payload)) {
    return NextResponse.json({ message: 'Invalid repository settings publish payload.' }, { status: 400 });
  }

  const settings = normalizeSiteSettings(payload.settings);
  const result = await createGitHubContentCommit(
    {
      message: 'settings: update site settings',
      files: payload.files,
    },
    config,
  );

  return NextResponse.json({
    settings,
    commitSha: result.sha,
    commitUrl: result.url,
  });
}

function isRepositorySettingsPublishPayload(payload: Partial<RepositorySettingsPublishPayload>): payload is RepositorySettingsPublishPayload {
  return Boolean(
    payload.settings &&
    Array.isArray(payload.files) &&
    payload.files.length > 0 &&
    payload.files.every((file) => file.path === 'apps/web/content/site-settings.json' && typeof file.content === 'string'),
  );
}
