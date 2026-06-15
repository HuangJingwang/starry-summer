export interface Env {
  ASSETS: R2Bucket;
  ASSET_ADMIN_SECRET?: string;
  ALLOWED_ORIGIN?: string;
  PUBLIC_BASE_URL?: string;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ArrayBuffer | Uint8Array | string, options?: R2PutOptions): Promise<unknown>;
  delete(key: string): Promise<void>;
}

interface R2ObjectBody {
  body: ReadableStream;
  writeHttpMetadata(headers: Headers): void;
}

interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
  };
}

type AssetUsage = 'content' | 'cover' | 'background' | 'attachment';

interface AssetUploadPayload {
  filename?: unknown;
  mimeType?: unknown;
  base64?: unknown;
  usage?: unknown;
  altText?: unknown;
}

interface StoredAsset {
  id: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  byteSize: number;
  usage: AssetUsage;
  altText: string;
  createdAt: string;
}

const indexKey = 'assets/index.json';
const validUsages = new Set<AssetUsage>(['content', 'cover', 'background', 'attachment']);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }), request, env);
    }

    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);

    try {
      if (request.method === 'GET' && segments[0] === 'assets' && segments[1] === 'file' && segments.length >= 3) {
        return withCors(await serveAssetFile(env, segments.slice(2).join('/')), request, env);
      }

      if (request.method === 'GET' && segments[0] === 'assets' && segments.length === 1) {
        return withCors(await listAssets(env, normalizeUsage(url.searchParams.get('usage'), 'background')), request, env);
      }

      if (request.method === 'GET' && segments[0] === 'assets' && segments[1] === 'random') {
        return withCors(await randomAsset(env, normalizeUsage(url.searchParams.get('usage'), 'background')), request, env);
      }

      if (segments[0] === 'admin' && segments[1] === 'assets') {
        if (!isAuthorized(request, env)) {
          return withCors(Response.json({ message: 'Unauthorized' }, { status: 401 }), request, env);
        }

        if (request.method === 'POST' && segments.length === 2) {
          return withCors(await uploadAsset(env, (await request.json()) as AssetUploadPayload), request, env);
        }

        if (request.method === 'GET' && segments.length === 2) {
          return withCors(await listAssets(env, normalizeUsage(url.searchParams.get('usage'))), request, env);
        }

        if (request.method === 'DELETE' && segments.length === 3) {
          return withCors(await deleteAsset(env, segments[2]), request, env);
        }
      }

      return withCors(Response.json({ message: 'Not found' }, { status: 404 }), request, env);
    } catch {
      return withCors(Response.json({ message: 'Asset worker error' }, { status: 500 }), request, env);
    }
  },
};

async function uploadAsset(env: Env, payload: AssetUploadPayload): Promise<Response> {
  const filename = normalizeFilename(payload.filename);
  const mimeType = typeof payload.mimeType === 'string' && payload.mimeType.trim() ? payload.mimeType.trim() : 'application/octet-stream';
  const base64 = typeof payload.base64 === 'string' ? payload.base64 : '';

  if (!base64) {
    return Response.json({ message: 'Missing asset payload.' }, { status: 400 });
  }

  const bytes = decodeBase64(base64);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const storageKey = buildStorageKey(now, id, filename);
  const asset: StoredAsset = {
    id,
    storageKey,
    publicUrl: buildPublicUrl(env, storageKey),
    mimeType,
    byteSize: bytes.byteLength,
    usage: normalizeUsage(payload.usage),
    altText: typeof payload.altText === 'string' ? payload.altText.trim() : '',
    createdAt: now,
  };

  await env.ASSETS.put(storageKey, bytes, {
    httpMetadata: {
      contentType: mimeType,
    },
  });
  await writeAssetIndex(env, [asset, ...(await readAssetIndex(env)).filter((item) => item.id !== id)]);

  return Response.json(asset, { status: 201 });
}

async function listAssets(env: Env, usage?: AssetUsage): Promise<Response> {
  const assets = (await readAssetIndex(env)).filter((asset) => (usage ? asset.usage === usage : true));

  return Response.json(assets);
}

async function randomAsset(env: Env, usage?: AssetUsage): Promise<Response> {
  const assets = (await readAssetIndex(env)).filter((asset) => (usage ? asset.usage === usage : true));

  if (assets.length === 0) {
    return new Response(null, { status: 404 });
  }

  return Response.json(assets[Math.floor(Math.random() * assets.length)]);
}

async function deleteAsset(env: Env, id: string): Promise<Response> {
  const assets = await readAssetIndex(env);
  const asset = assets.find((item) => item.id === id);

  if (!asset) {
    return Response.json({ message: 'Asset not found.' }, { status: 404 });
  }

  await env.ASSETS.delete(asset.storageKey);
  await writeAssetIndex(env, assets.filter((item) => item.id !== id));

  return Response.json({ id });
}

async function serveAssetFile(env: Env, storageKey: string): Promise<Response> {
  const object = await env.ASSETS.get(storageKey);

  if (!object) {
    return Response.json({ message: 'Asset not found.' }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}

async function readAssetIndex(env: Env): Promise<StoredAsset[]> {
  const object = await env.ASSETS.get(indexKey);

  if (!object) {
    return [];
  }

  const data = JSON.parse(await new Response(object.body).text()) as unknown;

  return Array.isArray(data) ? data.map(normalizeStoredAsset).filter((asset): asset is StoredAsset => Boolean(asset)) : [];
}

async function writeAssetIndex(env: Env, assets: StoredAsset[]): Promise<void> {
  await env.ASSETS.put(indexKey, JSON.stringify(assets, null, 2), {
    httpMetadata: {
      contentType: 'application/json; charset=utf-8',
    },
  });
}

function normalizeStoredAsset(input: unknown): StoredAsset | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Partial<StoredAsset>;

  if (!record.id || !record.storageKey || !record.publicUrl) {
    return null;
  }

  return {
    id: record.id,
    storageKey: record.storageKey,
    publicUrl: record.publicUrl,
    mimeType: record.mimeType || 'application/octet-stream',
    byteSize: record.byteSize || 0,
    usage: normalizeUsage(record.usage),
    altText: record.altText || '',
    createdAt: record.createdAt || '',
  };
}

function isAuthorized(request: Request, env: Env): boolean {
  const secret = env.ASSET_ADMIN_SECRET?.trim();

  if (!secret) {
    return false;
  }

  const headerSecret = request.headers.get('x-asset-admin-secret')?.trim();
  const bearerSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  return headerSecret === secret || bearerSecret === secret;
}

function normalizeUsage(value: unknown, fallback: AssetUsage = 'content'): AssetUsage {
  return typeof value === 'string' && validUsages.has(value as AssetUsage) ? (value as AssetUsage) : fallback;
}

function normalizeFilename(value: unknown): string {
  const filename = typeof value === 'string' ? value.trim() : '';
  const safeName = filename.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '-').toLowerCase();

  return safeName || 'asset';
}

function buildStorageKey(isoDate: string, id: string, filename: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');

  return `uploads/${year}/${month}/${day}/${id}-${filename}`;
}

function buildPublicUrl(env: Env, storageKey: string): string {
  const publicBaseUrl = env.PUBLIC_BASE_URL?.replace(/\/$/, '');

  return publicBaseUrl ? `${publicBaseUrl}/${storageKey}` : `/assets/file/${storageKey}`;
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = env.ALLOWED_ORIGIN || origin || '*';

  headers.set('access-control-allow-origin', allowedOrigin);
  headers.set('access-control-allow-methods', 'GET,POST,DELETE,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type,authorization,x-asset-admin-secret');
  headers.set('vary', 'origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
