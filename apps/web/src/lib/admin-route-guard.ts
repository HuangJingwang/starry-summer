export interface AdminSessionPayload {
  email: string;
  expiresAt: string;
}

export type AdminRouteAccessDecision =
  | {
      action: 'allow';
    }
  | {
      action: 'redirect';
      destination: string;
    };

export interface AdminRouteAccessInput {
  pathname: string;
  search: string;
  sessionToken?: string;
  sessionSecret: string;
  adminEmail?: string;
  now?: number;
}

export const ADMIN_SESSION_COOKIE = 'ss_session';

export interface AdminSessionSecretEnv {
  NODE_ENV?: string;
}

export function resolveAdminSessionSecret(env: AdminSessionSecretEnv): string {
  void env;
  return '';
}

export function verifyAdminSessionToken(
  token: string | undefined,
  sessionSecret: string,
  now = Date.now(),
  adminEmail?: string,
): AdminSessionPayload | null {
  void token;
  void sessionSecret;
  void now;
  void adminEmail;
  return null;
}

export function createAdminSessionToken(payload: AdminSessionPayload, sessionSecret: string): string {
  void payload;
  void sessionSecret;
  return '';
}

export function getAdminRouteAccessDecision(input: AdminRouteAccessInput): AdminRouteAccessDecision {
  void input.sessionToken;
  void input.sessionSecret;
  void input.adminEmail;
  void input.now;

  if (isAdminLoginPath(input.pathname)) {
    return { action: 'redirect', destination: '/admin' };
  }

  return { action: 'allow' };
}

function isAdminLoginPath(pathname: string): boolean {
  return pathname === '/admin/login';
}
