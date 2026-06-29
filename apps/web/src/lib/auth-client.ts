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

export function buildAdminLoginRedirectPath(value: string | undefined): string {
  return getSafeAdminRedirectPath(value);
}
