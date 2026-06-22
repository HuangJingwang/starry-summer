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
  assetBaseUrl?: string;
  timeoutMs?: number;
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
    mimeType: normalizeUploadMimeType(uploadFile.type, uploadFile.name),
    base64: bytesToBase64(new Uint8Array(await uploadFile.arrayBuffer())),
  };
}

export function buildAssetUploadRequest(payload: AssetUploadPayload, options: AssetRequestOptions = {}): AssetRequest | null {
  const url = buildAssetUrl('/api/repository/assets', '/api/admin/assets', options);

  if (!url) {
    return null;
  }

  return {
    url,
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

export function buildAdminAssetListRequest(options: AssetRequestOptions = {}): AssetRequest | null {
  const url = buildAssetUrl('/api/repository/assets', '/api/admin/assets', options);

  if (!url) {
    return null;
  }

  return {
    url,
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildPublicAssetListRequest(options: AssetRequestOptions = {}): AssetRequest | null {
  const url = buildExternalAssetUrl('/api/assets', options);

  if (!url) {
    return null;
  }

  return {
    url,
    init: {
      method: 'GET',
      next: {
        revalidate: 60,
      },
    },
  };
}

export function buildAssetDeleteRequest(id: string, options: AssetRequestOptions = {}): AssetRequest | null {
  const url = buildAssetUrl(`/api/repository/assets/${id}`, `/api/admin/assets/${id}`, options);

  if (!url) {
    return null;
  }

  return {
    url,
    init: {
      method: 'DELETE',
      credentials: 'include',
    },
  };
}

export async function readAssetErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { message?: unknown; error?: unknown };
      const message = normalizeErrorMessage(data.message) || normalizeErrorMessage(data.error);

      return message || fallback;
    }

    const text = (await response.text()).trim();

    return text || fallback;
  } catch {
    return fallback;
  }
}

export function buildRandomAssetRequest(options: AssetRequestOptions = {}): AssetRequest | null {
  const url = buildExternalAssetUrl('/api/assets/random', options);

  if (!url) {
    return null;
  }

  return {
    url,
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
  fetcher?: (url: string, init: RequestInit) => Promise<Response>,
): Promise<StoredAsset | null> {
  if (!fetcher && !getConfiguredAssetBaseUrl(options) && typeof window === 'undefined') {
    return null;
  }

  const request = buildRandomAssetRequest(options);

  if (!request) {
    return null;
  }

  const activeFetcher = fetcher ?? ((url: string, init: RequestInit) => fetch(url, init));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 1_500);

  try {
    const response = await activeFetcher(request.url, { ...request.init, signal: controller.signal });

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
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadPublicAssets(
  options: AssetRequestOptions = {},
  fetcher?: (url: string, init: RequestInit) => Promise<Response>,
): Promise<StoredAsset[]> {
  if (!fetcher && !getConfiguredAssetBaseUrl(options) && typeof window === 'undefined') {
    return [];
  }

  const request = buildPublicAssetListRequest(options);

  if (!request) {
    return [];
  }

  const activeFetcher = fetcher ?? ((url: string, init: RequestInit) => fetch(url, init));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 1_500);

  try {
    const response = await activeFetcher(request.url, { ...request.init, signal: controller.signal });

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
  } finally {
    clearTimeout(timeout);
  }
}

function buildAssetUrl(repositoryPath: string, externalPath: string, options: AssetRequestOptions): string | null {
  const baseUrl = getConfiguredAssetBaseUrl(options).replace(/\/$/, '');
  if (!baseUrl) {
    return appendUsage(repositoryPath, options);
  }

  const apiPath = externalPath.replace(/^\/api/, '');

  return appendUsage(`${baseUrl}${apiPath}`, options);
}

function buildExternalAssetUrl(path: string, options: AssetRequestOptions): string | null {
  const baseUrl = getConfiguredAssetBaseUrl(options).replace(/\/$/, '');
  if (!baseUrl) {
    return null;
  }

  const apiPath = path.replace(/^\/api/, '');

  return appendUsage(`${baseUrl}${apiPath}`, options);
}

function appendUsage(url: string, options: AssetRequestOptions): string {
  if (!options.usage) {
    return url;
  }

  const params = new URLSearchParams({ usage: options.usage });

  return `${url}?${params.toString()}`;
}

function getConfiguredAssetBaseUrl(options: AssetRequestOptions): string {
  const configuredAssetBaseUrl =
    options.assetBaseUrl ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    (typeof window === 'undefined' ? process.env.ASSET_BASE_URL : '') ||
    '';

  return configuredAssetBaseUrl.trim();
}

function normalizeErrorMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join('；');
  }

  return '';
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
  return ['image/jpeg', 'image/png', 'image/webp'].includes(normalizeUploadMimeType(file.type, file.name));
}

function normalizeUploadMimeType(mimeType: string, filename: string): string {
  const normalized = mimeType.trim().toLowerCase();

  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }

  if (normalized) {
    return normalized;
  }

  const extension = filename.split('.').pop()?.toLowerCase();

  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg';
  }

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  if (extension === 'gif') {
    return 'image/gif';
  }

  if (extension === 'pdf') {
    return 'application/pdf';
  }

  if (extension === 'md' || extension === 'markdown') {
    return 'text/markdown';
  }

  if (extension === 'txt') {
    return 'text/plain';
  }

  return 'application/octet-stream';
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
