export interface AnonymousReaderSession {
  authenticated: false;
}

export interface AuthenticatedReaderSession {
  authenticated: true;
  provider: 'github';
  login: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;
  expiresAt?: string;
}

export type ReaderSession = AnonymousReaderSession | AuthenticatedReaderSession;

export interface ReaderSessionRequestOptions {
  apiBaseUrl?: string;
  cookieHeader?: string;
}

export interface LoadReaderSessionOptions extends ReaderSessionRequestOptions {
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}

export function buildReaderSessionRequest(options: ReaderSessionRequestOptions = {}) {
  const path = '/api/auth/reader';
  const url = options.apiBaseUrl ? `${options.apiBaseUrl.replace(/\/$/, '')}${path.replace(/^\/api/, '')}` : path;
  const headers = options.cookieHeader ? { cookie: options.cookieHeader } : undefined;

  return {
    url,
    init: {
      method: 'GET',
      credentials: 'include' as RequestCredentials,
      ...(headers ? { headers } : {}),
    },
  };
}

export async function loadReaderSession(options: LoadReaderSessionOptions = {}): Promise<ReaderSession> {
  const request = buildReaderSessionRequest(options);
  const fetcher = options.fetcher ?? fetch;

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return { authenticated: false };
    }

    const data = (await response.json()) as Partial<AuthenticatedReaderSession>;

    if (data.authenticated !== true || data.provider !== 'github' || !data.login || !data.displayName || !data.profileUrl) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      provider: 'github',
      login: data.login,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      profileUrl: data.profileUrl,
      expiresAt: data.expiresAt,
    };
  } catch {
    return { authenticated: false };
  }
}
