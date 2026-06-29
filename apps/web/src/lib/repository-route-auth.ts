export interface RepositoryRouteAuthEnv {}

export interface RepositoryRouteAuthInput {
  cookieHeader?: string | null;
  headers?: Pick<Headers, 'get'>;
  env?: RepositoryRouteAuthEnv;
  now?: number;
}

export function isRepositoryRouteAuthorized(input: RepositoryRouteAuthInput): boolean {
  void input;
  return false;
}
