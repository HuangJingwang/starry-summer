import {
  ADMIN_SESSION_COOKIE,
  resolveAdminSessionSecret,
  verifyAdminSessionToken,
} from './admin-route-guard';

export interface RepositoryRouteAuthEnv {
  ADMIN_EMAIL?: string;
  NODE_ENV?: string;
  REPOSITORY_PUBLISH_SECRET?: string;
  SESSION_SECRET?: string;
}

export interface RepositoryRouteAuthInput {
  cookieHeader?: string | null;
  headers?: Pick<Headers, 'get'>;
  env?: RepositoryRouteAuthEnv;
  now?: number;
}

export function isRepositoryRouteAuthorized(input: RepositoryRouteAuthInput): boolean {
  const env = input.env ?? process.env;
  const publishSecret = env.REPOSITORY_PUBLISH_SECRET?.trim();
  const providedSecret = input.headers?.get('x-repository-publish-secret')?.trim();

  if (publishSecret && providedSecret === publishSecret) {
    return true;
  }

  const sessionToken = getCookieValue(input.cookieHeader ?? '', ADMIN_SESSION_COOKIE);

  return Boolean(
    verifyAdminSessionToken(
      sessionToken,
      resolveAdminSessionSecret(env),
      input.now,
      env.ADMIN_EMAIL,
    ),
  );
}

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  for (const segment of cookieHeader.split(';')) {
    const [key = '', ...valueParts] = segment.trim().split('=');

    if (key === name) {
      return valueParts.join('=');
    }
  }

  return undefined;
}
