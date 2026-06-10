import type { CommentTargetType } from './interaction-client';

export interface PublicComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type PublicGuestbookEntry = PublicComment;

export interface PublicCommentRequestOptions {
  apiBaseUrl?: string;
}

export interface PublicCommentLoadOptions extends PublicCommentRequestOptions {
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}

export interface PublicCommentRequest {
  url: string;
  init: RequestInit & { next?: { revalidate: number } };
}

function getDefaultApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
}

export function buildApprovedCommentsRequest(
  targetType: CommentTargetType,
  targetId: string,
  options: PublicCommentRequestOptions = {},
): PublicCommentRequest {
  const baseUrl = (options.apiBaseUrl ?? getDefaultApiBaseUrl()).replace(/\/$/, '');

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
): PublicCommentRequest {
  const baseUrl = (options.apiBaseUrl ?? getDefaultApiBaseUrl()).replace(/\/$/, '');

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
  };
}

export async function loadApprovedComments(
  targetType: CommentTargetType,
  targetId: string,
  options: PublicCommentLoadOptions = {},
): Promise<PublicComment[]> {
  const request = buildApprovedCommentsRequest(targetType, targetId, options);
  const fetcher = options.fetcher ?? fetch;

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
