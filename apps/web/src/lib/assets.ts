export interface AssetUploadPayload {
  filename: string;
  mimeType: string;
  base64: string;
}

export interface StoredAsset {
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  byteSize: number;
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

export function normalizeStoredAsset(input: Partial<StoredAsset>): StoredAsset {
  return {
    storageKey: input.storageKey ?? '',
    publicUrl: input.publicUrl ?? '',
    mimeType: input.mimeType ?? 'application/octet-stream',
    byteSize: input.byteSize ?? 0,
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}
