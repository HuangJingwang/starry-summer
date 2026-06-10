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
}

const jsonHeaders = {
  'content-type': 'application/json',
};

export function buildLikeRequest(targetType: ContentType, targetId: string): InteractionRequest {
  return {
    url: `/api/likes/${targetType}/${targetId}`,
    init: {
      method: 'POST',
      headers: jsonHeaders,
    },
  };
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

export function normalizeModerationRecord(input: Partial<ModerationRecord> & { id: string }): ModerationRecord {
  return {
    id: input.id,
    targetType: input.targetType,
    targetId: input.targetId,
    authorName: input.authorName ?? '',
    body: input.body ?? '',
    status: input.status ?? 'pending',
    createdAt: input.createdAt ?? '',
  };
}
