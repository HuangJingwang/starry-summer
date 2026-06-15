import type { ContentType, ModerationStatus } from '@starry-summer/shared';
import { PUBLIC_SUBMISSION_LIMITS } from '@starry-summer/shared';

import type { InlineCommentAnchor } from './selection-comments';

export { PUBLIC_SUBMISSION_LIMITS };

export type CommentTargetType = Extract<ContentType, 'post' | 'note' | 'project'>;

export interface CommentInput {
  targetType: CommentTargetType;
  targetId: string;
  body: string;
  anchor?: CommentAnchorInput;
}

export type CommentAnchorInput = InlineCommentAnchor;

export interface GuestbookInput {
  body: string;
}

export interface InteractionRequest {
  url: string;
  init: RequestInit;
}

export type InteractionSeenStore = Pick<Set<string>, 'add' | 'has'>;

export interface InteractionSeenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface AdminInteractionRequestOptions {
  interactionBaseUrl?: string;
  cookieHeader?: string;
}

export interface AdminModerationCountOptions extends AdminInteractionRequestOptions {
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}

export type ModerationResource = 'comments' | 'guestbook';

export interface ModerationRecord {
  id: string;
  authorName: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
  targetType?: CommentTargetType;
  targetId?: string;
  ipHash?: string;
  userAgent?: string;
  anchor?: InlineCommentAnchor;
}

const jsonHeaders = {
  'content-type': 'application/json',
};
const seenInteractionsStorageKey = 'starry-summer:seen-interactions';

export interface PublicInteractionRequestOptions {
  interactionBaseUrl?: string;
}

function getDefaultPublicInteractionBaseUrl(): string {
  return process.env.NEXT_PUBLIC_INTERACTION_BASE_URL ?? '';
}

function buildPublicInteractionUrl(path: string, options: PublicInteractionRequestOptions = {}): string | null {
  const baseUrl = (options.interactionBaseUrl ?? getDefaultPublicInteractionBaseUrl()).trim().replace(/\/$/, '');

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}${path.replace(/^\/api/, '')}`;
}

function getAdminInteractionBaseUrl(options: AdminInteractionRequestOptions): string | null {
  const baseUrl = (options.interactionBaseUrl ?? process.env.NEXT_PUBLIC_INTERACTION_BASE_URL ?? '').trim();

  return baseUrl ? baseUrl.replace(/\/$/, '') : null;
}

export function buildLikeRequest(
  targetType: ContentType,
  targetId: string,
  options: PublicInteractionRequestOptions = {},
): InteractionRequest | null {
  const url = buildPublicInteractionUrl(`/api/likes/${targetType}/${targetId}`, options);

  if (!url) {
    return null;
  }

  return {
    url,
    init: {
      method: 'POST',
      headers: jsonHeaders,
    },
  };
}

export function buildViewRequest(
  targetType: ContentType,
  targetId: string,
  options: PublicInteractionRequestOptions = {},
): InteractionRequest | null {
  const url = buildPublicInteractionUrl(`/api/views/${targetType}/${targetId}`, options);

  if (!url) {
    return null;
  }

  return {
    url,
    init: {
      method: 'POST',
      headers: jsonHeaders,
    },
  };
}

export function buildDedupedViewRequest(
  targetType: ContentType,
  targetId: string,
  seen: InteractionSeenStore,
  options: PublicInteractionRequestOptions = {},
): InteractionRequest | null {
  return buildDedupedInteractionRequest('view', targetType, targetId, seen, () => buildViewRequest(targetType, targetId, options));
}

export function buildDedupedLikeRequest(
  targetType: ContentType,
  targetId: string,
  seen: InteractionSeenStore,
  options: PublicInteractionRequestOptions = {},
): InteractionRequest | null {
  return buildDedupedInteractionRequest('like', targetType, targetId, seen, () => buildLikeRequest(targetType, targetId, options));
}

export function createPersistentInteractionSeenStore(
  memory: Set<string> = new Set<string>(),
  storage: InteractionSeenStorage | null = getBrowserInteractionStorage(),
): InteractionSeenStore {
  for (const key of readSeenInteractions(storage)) {
    memory.add(key);
  }

  return {
    has: (key) => memory.has(key),
    add: (key) => {
      memory.add(key);
      writeSeenInteractions(storage, memory);
      return memory;
    },
  };
}

export function buildCommentRequest(
  input: CommentInput,
  options: PublicInteractionRequestOptions = {},
): InteractionRequest | null {
  const url = buildPublicInteractionUrl('/api/comments', options);

  if (!url) {
    return null;
  }

  return {
    url,
    init: {
      method: 'POST',
      credentials: 'include',
      headers: jsonHeaders,
      body: JSON.stringify({
        targetType: input.targetType,
        targetId: input.targetId,
        body: input.body.trim(),
        ...(input.anchor ? { anchor: input.anchor } : {}),
      }),
    },
  };
}

function buildDedupedInteractionRequest(
  kind: 'like' | 'view',
  targetType: ContentType,
  targetId: string,
  seen: InteractionSeenStore,
  build: () => InteractionRequest | null,
): InteractionRequest | null {
  const key = `${kind}:${targetType}:${targetId}`;

  if (seen.has(key)) {
    return null;
  }

  const request = build();

  if (!request) {
    return null;
  }

  seen.add(key);

  return request;
}

function getBrowserInteractionStorage(): InteractionSeenStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readSeenInteractions(storage: InteractionSeenStorage | null): string[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(seenInteractionsStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeSeenInteractions(storage: InteractionSeenStorage | null, seen: Set<string>): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(seenInteractionsStorageKey, JSON.stringify([...seen].sort()));
  } catch {
    // Browser storage can be unavailable in private mode; server-side de-dupe still protects counts.
  }
}

export function buildGuestbookRequest(
  input: GuestbookInput,
  options: PublicInteractionRequestOptions = {},
): InteractionRequest | null {
  const url = buildPublicInteractionUrl('/api/guestbook', options);

  if (!url) {
    return null;
  }

  return {
    url,
    init: {
      method: 'POST',
      credentials: 'include',
      headers: jsonHeaders,
      body: JSON.stringify({
        body: input.body.trim(),
      }),
    },
  };
}

export function buildAdminModerationListRequest(
  resource: ModerationResource,
  status?: ModerationStatus,
  options: AdminInteractionRequestOptions = {},
): InteractionRequest | null {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const path = `/api/admin/${resource}${query}`;
  const baseUrl = getAdminInteractionBaseUrl(options);
  const url = baseUrl ? `${baseUrl}${path.replace(/^\/api/, '')}` : null;
  const headers = options.cookieHeader ? { cookie: options.cookieHeader } : undefined;

  if (!url) {
    return null;
  }

  return {
    url,
    init: {
      method: 'GET',
      credentials: 'include',
      ...(headers ? { headers } : {}),
    },
  };
}

export async function loadAdminModerationCount(
  resource: ModerationResource,
  status: ModerationStatus,
  options: AdminModerationCountOptions = {},
): Promise<number> {
  const request = buildAdminModerationListRequest(resource, status, options);
  const fetcher = options.fetcher ?? fetch;

  if (!request) {
    return 0;
  }

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return 0;
    }

    const data: unknown = await response.json();

    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export function buildModerationActionRequest(
  resource: ModerationResource,
  id: string,
  status: ModerationStatus,
  options: AdminInteractionRequestOptions = {},
): InteractionRequest | null {
  const path = `/api/admin/${resource}/${id}/moderate`;
  const baseUrl = getAdminInteractionBaseUrl(options);

  if (!baseUrl) {
    return null;
  }

  return {
    url: `${baseUrl}${path.replace(/^\/api/, '')}`,
    init: {
      method: 'PATCH',
      credentials: 'include',
      headers: jsonHeaders,
      body: JSON.stringify({ status }),
    },
  };
}

export function buildModerationDeleteRequest(
  resource: ModerationResource,
  id: string,
  options: AdminInteractionRequestOptions = {},
): InteractionRequest | null {
  const path = `/api/admin/${resource}/${id}`;
  const baseUrl = getAdminInteractionBaseUrl(options);

  if (!baseUrl) {
    return null;
  }

  return {
    url: `${baseUrl}${path.replace(/^\/api/, '')}`,
    init: {
      method: 'DELETE',
      credentials: 'include',
    },
  };
}

export async function readInteractionErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { message?: unknown; error?: unknown };
      const message = normalizeInteractionErrorMessage(data.message) || normalizeInteractionErrorMessage(data.error);

      return message || fallback;
    }

    const text = (await response.text()).trim();

    return text || fallback;
  } catch {
    return fallback;
  }
}

function normalizeInteractionErrorMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join('；');
  }

  return '';
}

export function normalizeModerationRecord(input: Partial<ModerationRecord> & { id: string }): ModerationRecord {
  return {
    id: input.id,
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.targetId ? { targetId: input.targetId } : {}),
    authorName: input.authorName ?? '',
    body: input.body ?? '',
    status: input.status ?? 'pending',
    createdAt: input.createdAt ?? '',
    ...(input.ipHash ? { ipHash: input.ipHash } : {}),
    ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    ...(input.anchor ? { anchor: input.anchor } : {}),
  };
}
