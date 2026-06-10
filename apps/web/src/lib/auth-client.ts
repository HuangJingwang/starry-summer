export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginRequest {
  url: string;
  init: RequestInit;
}

export function normalizeLoginInput(input: LoginInput): LoginInput {
  return {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
}

export function getSafeAdminRedirectPath(value: string | undefined): string {
  if (!value) {
    return '/admin';
  }

  try {
    const url = new URL(value, 'http://localhost');

    if (url.origin !== 'http://localhost' || (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/'))) {
      return '/admin';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/admin';
  }
}

export function buildLoginRequest(input: LoginInput): LoginRequest {
  const normalized = normalizeLoginInput(input);

  return {
    url: '/api/auth/login',
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(normalized),
    },
  };
}

export function buildSessionRequest(): LoginRequest {
  return {
    url: '/api/auth/me',
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildLogoutRequest(): LoginRequest {
  return {
    url: '/api/auth/logout',
    init: {
      method: 'POST',
      credentials: 'include',
    },
  };
}
