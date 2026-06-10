import type { ContentType } from '@starry-summer/shared';

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
