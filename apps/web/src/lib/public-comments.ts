import type { CommentTargetType } from './interaction-client';
import type { InlineCommentAnchor } from './selection-comments';

export interface PublicComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  anchor?: InlineCommentAnchor;
}

export type PublicGuestbookEntry = PublicComment;

export interface PublicCommentRequestOptions {
  interactionBaseUrl?: string;
}

export interface PublicCommentLoadOptions extends PublicCommentRequestOptions {
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}

export interface PublicCommentRequest {
  url: string;
  init: RequestInit & { next?: { revalidate: number } };
}

function getDefaultInteractionBaseUrl(): string {
  return process.env.INTERACTION_BASE_URL ?? process.env.NEXT_PUBLIC_INTERACTION_BASE_URL ?? '';
}

function getPublicCommentBaseUrl(options: PublicCommentRequestOptions): string | null {
  const interactionBaseUrl = (options.interactionBaseUrl ?? getDefaultInteractionBaseUrl()).trim();

  return interactionBaseUrl ? interactionBaseUrl.replace(/\/$/, '') : null;
}

export function buildApprovedCommentsRequest(
  targetType: CommentTargetType,
  targetId: string,
  options: PublicCommentRequestOptions = {},
): PublicCommentRequest | null {
  const baseUrl = getPublicCommentBaseUrl(options);

  if (!baseUrl) {
    return null;
  }

  return {
    url: `${baseUrl}/comments/${targetType}/${targetId}`,
    init: {
      method: 'GET',
      next: {
        revalidate: 30,
      },
    },
  };
}

export function buildApprovedGuestbookRequest(
  options: PublicCommentRequestOptions = {},
): PublicCommentRequest | null {
  const baseUrl = getPublicCommentBaseUrl(options);

  if (!baseUrl) {
    return null;
  }

  return {
    url: `${baseUrl}/guestbook`,
    init: {
      method: 'GET',
      next: {
        revalidate: 30,
      },
    },
  };
}

export function normalizePublicComment(input: Partial<PublicComment> & { id: string }): PublicComment {
  return {
    id: input.id,
    authorName: input.authorName ?? '',
    body: input.body ?? '',
    createdAt: input.createdAt ?? '',
    ...(input.anchor ? { anchor: input.anchor } : {}),
  };
}

export async function loadApprovedComments(
  targetType: CommentTargetType,
  targetId: string,
  options: PublicCommentLoadOptions = {},
): Promise<PublicComment[]> {
  const request = buildApprovedCommentsRequest(targetType, targetId, options);
  const fetcher = options.fetcher ?? fetch;

  if (!request) {
    return [];
  }

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => normalizePublicComment(item as Partial<PublicComment> & { id: string }));
  } catch {
    return [];
  }
}

export async function loadApprovedGuestbookEntries(
  options: PublicCommentLoadOptions = {},
): Promise<PublicGuestbookEntry[]> {
  const request = buildApprovedGuestbookRequest(options);
  const fetcher = options.fetcher ?? fetch;

  if (!request) {
    return [];
  }

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => normalizePublicComment(item as Partial<PublicComment> & { id: string }));
  } catch {
    return [];
  }
}
