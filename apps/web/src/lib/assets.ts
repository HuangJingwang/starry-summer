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
  init: RequestInit;
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

export function buildAssetListRequest(options: { usage?: AssetUsage } = {}): AssetRequest {
  return {
    url: buildAssetUrl('/api/assets', options.usage),
    init: {
      method: 'GET',
    },
  };
}

export function buildAdminAssetListRequest(options: { usage?: AssetUsage } = {}): AssetRequest {
  return {
    url: buildAssetUrl('/api/admin/assets', options.usage),
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildRandomAssetRequest(options: { usage?: AssetUsage } = {}): AssetRequest {
  return {
    url: buildAssetUrl('/api/assets/random', options.usage),
    init: {
      method: 'GET',
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

function buildAssetUrl(path: string, usage: AssetUsage | undefined): string {
  if (!usage) {
    return path;
  }

  const params = new URLSearchParams({ usage });

  return `${path}?${params.toString()}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}
