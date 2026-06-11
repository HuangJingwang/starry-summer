import type { ContentType, ModerationStatus } from '@starry-summer/shared';

export type CommentTargetType = Extract<ContentType, 'post' | 'note' | 'project'>;

export interface CommentInput {
  targetType: CommentTargetType;
  targetId: string;
  authorName: string;
  body: string;
}

export interface GuestbookInput {
  authorName: string;
  body: string;
}

export interface InteractionRequest {
  url: string;
  init: RequestInit;
}

export type InteractionSeenStore = Pick<Set<string>, 'add' | 'has'>;

export interface AdminInteractionRequestOptions {
  apiBaseUrl?: string;
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
}

const jsonHeaders = {
  'content-type': 'application/json',
};

export const PUBLIC_SUBMISSION_LIMITS = {
  authorName: 80,
  body: 2000,
} as const;

export function buildLikeRequest(targetType: ContentType, targetId: string): InteractionRequest {
  return {
    url: `/api/likes/${targetType}/${targetId}`,
    init: {
      method: 'POST',
      headers: jsonHeaders,
    },
  };
}

export function buildViewRequest(targetType: ContentType, targetId: string): InteractionRequest {
  return {
    url: `/api/views/${targetType}/${targetId}`,
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
): InteractionRequest | null {
  return buildDedupedInteractionRequest('view', targetType, targetId, seen, () => buildViewRequest(targetType, targetId));
}

export function buildDedupedLikeRequest(
  targetType: ContentType,
  targetId: string,
  seen: InteractionSeenStore,
): InteractionRequest | null {
  return buildDedupedInteractionRequest('like', targetType, targetId, seen, () => buildLikeRequest(targetType, targetId));
}

export function buildCommentRequest(input: CommentInput): InteractionRequest {
  return {
    url: '/api/comments',
    init: {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        targetType: input.targetType,
        targetId: input.targetId,
        authorName: input.authorName.trim(),
        body: input.body.trim(),
      }),
    },
  };
}

function buildDedupedInteractionRequest(
  kind: 'like' | 'view',
  targetType: ContentType,
  targetId: string,
  seen: InteractionSeenStore,
  build: () => InteractionRequest,
): InteractionRequest | null {
  const key = `${kind}:${targetType}:${targetId}`;

  if (seen.has(key)) {
    return null;
  }

  seen.add(key);

  return build();
}

export function buildGuestbookRequest(input: GuestbookInput): InteractionRequest {
  return {
    url: '/api/guestbook',
    init: {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        authorName: input.authorName.trim(),
        body: input.body.trim(),
      }),
    },
  };
}

export function buildAdminModerationListRequest(
  resource: ModerationResource,
  status?: ModerationStatus,
  options: AdminInteractionRequestOptions = {},
): InteractionRequest {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const path = `/api/admin/${resource}${query}`;
  const url = options.apiBaseUrl
    ? `${options.apiBaseUrl.replace(/\/$/, '')}${path.replace(/^\/api/, '')}`
    : path;
  const headers = options.cookieHeader ? { cookie: options.cookieHeader } : undefined;

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
): InteractionRequest {
  return {
    url: `/api/admin/${resource}/${id}/moderate`,
    init: {
      method: 'PATCH',
      credentials: 'include',
      headers: jsonHeaders,
      body: JSON.stringify({ status }),
    },
  };
}

export function buildModerationDeleteRequest(resource: ModerationResource, id: string): InteractionRequest {
  return {
    url: `/api/admin/${resource}/${id}`,
    init: {
      method: 'DELETE',
      credentials: 'include',
    },
  };
}

export function normalizeModerationRecord(input: Partial<ModerationRecord> & { id: string }): ModerationRecord {
  return {
    id: input.id,
    targetType: input.targetType,
    targetId: input.targetId,
    authorName: input.authorName ?? '',
    body: input.body ?? '',
    status: input.status ?? 'pending',
    createdAt: input.createdAt ?? '',
    ipHash: input.ipHash,
    userAgent: input.userAgent,
  };
}
