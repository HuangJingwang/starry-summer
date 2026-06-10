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
