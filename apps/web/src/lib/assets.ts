export interface AssetUploadPayload {
  filename: string;
  mimeType: string;
  base64: string;
  usage?: AssetUsage;
  altText?: string;
}

export type AssetUsage = 'content' | 'cover' | 'background' | 'attachment';

export interface StoredAsset {
  id: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  byteSize: number;
  usage: AssetUsage;
  altText: string;
  createdAt: string;
}

export interface AssetRequest {
  url: string;
  init: RequestInit & { next?: { revalidate: number } };
}

export interface AssetRequestOptions {
  usage?: AssetUsage;
  apiBaseUrl?: string;
}

export async function buildAssetUploadPayload(file: File): Promise<AssetUploadPayload> {
  return {
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())),
  };
}

export function buildAssetUploadRequest(payload: AssetUploadPayload): AssetRequest {
  return {
    url: '/api/admin/assets',
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  };
}

export function buildAssetListRequest(options: AssetRequestOptions = {}): AssetRequest {
  return {
    url: buildAssetUrl('/api/assets', options),
    init: {
      method: 'GET',
    },
  };
}

export function buildAdminAssetListRequest(options: AssetRequestOptions = {}): AssetRequest {
  return {
    url: buildAssetUrl('/api/admin/assets', options),
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildRandomAssetRequest(options: AssetRequestOptions = {}): AssetRequest {
  return {
    url: buildAssetUrl('/api/assets/random', options),
    init: {
      method: 'GET',
      next: {
        revalidate: 60,
      },
    },
  };
}

export function normalizeStoredAsset(input: Partial<StoredAsset>): StoredAsset {
  return {
    id: input.id ?? '',
    storageKey: input.storageKey ?? '',
    publicUrl: input.publicUrl ?? '',
    mimeType: input.mimeType ?? 'application/octet-stream',
    byteSize: input.byteSize ?? 0,
    usage: input.usage ?? 'content',
    altText: input.altText ?? '',
    createdAt: input.createdAt ?? '',
  };
}

export async function loadRandomAsset(
  options: AssetRequestOptions = {},
  fetcher: (url: string, init: RequestInit) => Promise<Response> = (url, init) => fetch(url, init),
): Promise<StoredAsset | null> {
  const request = buildRandomAssetRequest(options);

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();

    if (!data) {
      return null;
    }

    return normalizeStoredAsset(data as Partial<StoredAsset>);
  } catch {
    return null;
  }
}

function buildAssetUrl(path: string, options: AssetRequestOptions): string {
  const baseUrl = options.apiBaseUrl ? options.apiBaseUrl.replace(/\/$/, '') : '';
  const apiPath = baseUrl ? path.replace(/^\/api/, '') : path;

  if (!options.usage) {
    return `${baseUrl}${apiPath}`;
  }

  const params = new URLSearchParams({ usage: options.usage });

  return `${baseUrl}${apiPath}?${params.toString()}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}
