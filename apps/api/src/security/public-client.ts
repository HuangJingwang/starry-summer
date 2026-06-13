export interface PublicClientRequest {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

export interface PublicClientAddressOptions {
  trustProxy?: boolean;
}

export function resolvePublicClientAddress(
  request: PublicClientRequest,
  options: PublicClientAddressOptions = {},
): string {
  const trustedProxy = options.trustProxy ?? process.env.TRUST_PROXY === 'true';
  const forwardedClient = trustedProxy ? resolveForwardedClientAddress(request) : undefined;

  return (
    forwardedClient ||
    request.ip ||
    request.socket?.remoteAddress ||
    'unknown-ip'
  );
}

export function resolvePublicUserAgent(request: PublicClientRequest): string {
  return (firstHeaderValue(request.headers?.['user-agent'])?.trim() || 'unknown-agent').slice(0, 500);
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function resolveForwardedClientAddress(request: PublicClientRequest): string | undefined {
  const forwardedFor = firstHeaderValue(request.headers?.['x-forwarded-for']);
  const forwardedClient = forwardedFor
    ?.split(',')
    .map((item) => item.trim())
    .find(Boolean);

  return forwardedClient || firstHeaderValue(request.headers?.['x-real-ip'])?.trim() || undefined;
}
