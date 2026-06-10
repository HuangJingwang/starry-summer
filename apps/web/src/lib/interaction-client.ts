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
): InteractionRequest {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';

  return {
    url: `/api/admin/${resource}${query}`,
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
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
