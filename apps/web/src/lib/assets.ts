export interface AssetUploadPayload {
  filename: string;
  mimeType: string;
  base64: string;
  usage?: AssetUsage;
  altText?: string;
}

export type AssetUsage = 'content' | 'cover' | 'background' | 'attachment';

export interface ImageUploadOptimizer {
  optimize(file: File): Promise<File | null>;
}

export interface AssetUploadPayloadOptions {
  imageOptimizer?: ImageUploadOptimizer | null;
}

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

export interface MarkdownSelectionRange {
  start: number;
  end: number;
}

export interface MarkdownAssetInsertion {
  markdown: string;
  selectionStart: number;
  selectionEnd: number;
}

export async function buildAssetUploadPayload(file: File, options: AssetUploadPayloadOptions = {}): Promise<AssetUploadPayload> {
  const uploadFile = await prepareUploadFile(file, options);

  return {
    filename: uploadFile.name,
    mimeType: uploadFile.type || 'application/octet-stream',
    base64: bytesToBase64(new Uint8Array(await uploadFile.arrayBuffer())),
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

export function buildAdminAssetListRequest(options: AssetRequestOptions = {}): AssetRequest {
  return {
    url: buildAssetUrl('/api/admin/assets', options),
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildPublicAssetListRequest(options: AssetRequestOptions = {}): AssetRequest {
  return {
    url: buildAssetUrl('/api/assets', options),
    init: {
      method: 'GET',
      next: {
        revalidate: 60,
      },
    },
  };
}

export function buildAssetDeleteRequest(id: string): AssetRequest {
  return {
    url: `/api/admin/assets/${id}`,
    init: {
      method: 'DELETE',
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

export function buildMarkdownAssetEmbed(asset: Pick<StoredAsset, 'altText' | 'mimeType' | 'publicUrl' | 'storageKey'>): string {
  const label = asset.altText.trim() || filenameFromStorageKey(asset.storageKey) || asset.publicUrl;

  if (asset.mimeType.startsWith('image/')) {
    return `![${escapeMarkdownLabel(label)}](${asset.publicUrl})`;
  }

  return `[${escapeMarkdownLabel(label)}](${asset.publicUrl})`;
}

export function insertMarkdownAsset(
  markdown: string,
  asset: Pick<StoredAsset, 'altText' | 'mimeType' | 'publicUrl' | 'storageKey'>,
  selection: MarkdownSelectionRange,
): MarkdownAssetInsertion {
  const start = clampSelectionIndex(selection.start, markdown.length);
  const end = clampSelectionIndex(selection.end, markdown.length);
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const embed = buildMarkdownAssetEmbed(asset);
  const nextMarkdown = `${markdown.slice(0, from)}${embed}${markdown.slice(to)}`;
  const cursor = from + embed.length;

  return {
    markdown: nextMarkdown,
    selectionStart: cursor,
    selectionEnd: cursor,
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

export async function loadPublicAssets(
  options: AssetRequestOptions = {},
  fetcher: (url: string, init: RequestInit) => Promise<Response> = (url, init) => fetch(url, init),
): Promise<StoredAsset[]> {
  const request = buildPublicAssetListRequest(options);

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => normalizeStoredAsset(item as Partial<StoredAsset>));
  } catch {
    return [];
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

async function prepareUploadFile(file: File, options: AssetUploadPayloadOptions): Promise<File> {
  if (!canOptimizeImage(file)) {
    return file;
  }

  const optimizer = options.imageOptimizer === undefined ? createBrowserImageUploadOptimizer() : options.imageOptimizer;

  if (!optimizer) {
    return file;
  }

  try {
    const optimized = await optimizer.optimize(file);

    if (optimized && optimized.size > 0 && optimized.size < file.size) {
      return optimized;
    }
  } catch {
    return file;
  }

  return file;
}

function canOptimizeImage(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

function createBrowserImageUploadOptimizer(): ImageUploadOptimizer | null {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return null;
  }

  return {
    optimize: optimizeImageWithCanvas,
  };
}

async function optimizeImageWithCanvas(file: File): Promise<File | null> {
  const image = await loadUploadImage(file);

  try {
    const maxEdge = 1800;
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.82);
    });

    if (!blob) {
      return null;
    }

    return new File([blob], replaceImageExtension(file.name, 'webp'), {
      type: 'image/webp',
      lastModified: file.lastModified,
    });
  } finally {
    releaseUploadImage(image);
  }
}

async function loadUploadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image upload preview failed'));
    };
    image.src = objectUrl;
  });
}

function releaseUploadImage(image: ImageBitmap | HTMLImageElement): void {
  if ('close' in image) {
    image.close();
  }
}

function replaceImageExtension(filename: string, extension: string): string {
  const nextExtension = extension.replace(/^\.+/, '') || 'webp';
  const baseName = filename.replace(/\.[^.]*$/, '').trim() || 'image';

  return `${baseName}.${nextExtension}`;
}

function filenameFromStorageKey(storageKey: string): string {
  return storageKey.split('/').filter(Boolean).at(-1) ?? '';
}

function escapeMarkdownLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\]/g, '\\]');
}

function clampSelectionIndex(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return max;
  }

  return Math.max(0, Math.min(max, Math.trunc(value)));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}
