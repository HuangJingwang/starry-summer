import { describe, expect, test } from 'vitest';

import {
  buildAdminModerationListRequest,
  buildCommentRequest,
  buildGuestbookRequest,
  buildDedupedLikeRequest,
  buildDedupedViewRequest,
  buildLikeRequest,
  buildModerationActionRequest,
  buildModerationDeleteRequest,
  buildViewRequest,
  loadAdminModerationCount,
  normalizeModerationRecord,
  PUBLIC_SUBMISSION_LIMITS,
} from './interaction-client';

describe('interaction client helpers', () => {
  test('exposes public submission field limits that match the API validation contract', () => {
    expect(PUBLIC_SUBMISSION_LIMITS).toEqual({
      authorName: 80,
      body: 2000,
    });
  });

  test('builds like request', () => {
    expect(buildLikeRequest('post', 'post-1')).toEqual({
      url: '/api/likes/post/post-1',
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      },
    });
  });

  test('builds view request', () => {
    expect(buildViewRequest('post', 'post-1')).toEqual({
      url: '/api/views/post/post-1',
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      },
    });
  });

  test('builds view requests only once per local target', () => {
    const seen = new Set<string>();

    expect(buildDedupedViewRequest('post', 'post-1', seen)).toEqual(buildViewRequest('post', 'post-1'));
    expect(buildDedupedViewRequest('post', 'post-1', seen)).toBeNull();
    expect(buildDedupedViewRequest('note', 'note-1', seen)).toEqual(buildViewRequest('note', 'note-1'));
  });

  test('builds like requests only once per local target', () => {
    const seen = new Set<string>();

    expect(buildDedupedLikeRequest('post', 'post-1', seen)).toEqual(buildLikeRequest('post', 'post-1'));
    expect(buildDedupedLikeRequest('post', 'post-1', seen)).toBeNull();
    expect(buildDedupedLikeRequest('post', 'post-2', seen)).toEqual(buildLikeRequest('post', 'post-2'));
  });

  test('builds comment request', () => {
    expect(
      buildCommentRequest({
        targetType: 'post',
        targetId: 'post-1',
        authorName: ' Reader ',
        body: ' Nice post. ',
      }),
    ).toEqual({
      url: '/api/comments',
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetType: 'post',
          targetId: 'post-1',
          authorName: 'Reader',
          body: 'Nice post.',
        }),
      },
    });
  });

  test('builds credentialed guestbook request without accepting a forged author name', () => {
    expect(buildGuestbookRequest({ body: ' Hello. ' })).toEqual({
      url: '/api/guestbook',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          body: 'Hello.',
        }),
      },
    });
    expect(buildGuestbookRequest({ body: ' Hello. ' }).init.body).toBe(
      JSON.stringify({
        body: 'Hello.',
      }),
    );
  });

  test('builds admin moderation list requests', () => {
    expect(buildAdminModerationListRequest('comments')).toEqual({
      url: '/api/admin/comments',
      init: {
        method: 'GET',
        credentials: 'include',
      },
    });
    expect(buildAdminModerationListRequest('guestbook', 'pending').url).toBe('/api/admin/guestbook?status=pending');
    expect(
      buildAdminModerationListRequest('comments', 'pending', {
        apiBaseUrl: 'https://api.example.com/',
        cookieHeader: 'ss_session=session-token',
      }),
    ).toEqual({
      url: 'https://api.example.com/admin/comments?status=pending',
      init: {
        method: 'GET',
        credentials: 'include',
        headers: {
          cookie: 'ss_session=session-token',
        },
      },
    });
  });

  test('loads moderation counts with fallback on API failure', async () => {
    await expect(
      loadAdminModerationCount('comments', 'pending', {
        fetcher: async () =>
          new Response(
            JSON.stringify([
              { id: '1', authorName: 'A', body: 'Pending', status: 'pending', createdAt: '2026-06-10T00:00:00.000Z' },
              { id: '2', authorName: 'B', body: 'Pending', status: 'pending', createdAt: '2026-06-10T00:00:00.000Z' },
            ]),
          ),
      }),
    ).resolves.toBe(2);

    await expect(
      loadAdminModerationCount('guestbook', 'pending', {
        fetcher: async () => new Response('Unauthorized', { status: 401 }),
      }),
    ).resolves.toBe(0);
  });

  test('builds moderation action requests', () => {
    expect(buildModerationActionRequest('comments', 'comment-1', 'approved')).toEqual({
      url: '/api/admin/comments/comment-1/moderate',
      init: {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      },
    });
    expect(buildModerationActionRequest('guestbook', 'entry-1', 'rejected').url).toBe('/api/admin/guestbook/entry-1/moderate');
  });

  test('builds moderation delete requests', () => {
    expect(buildModerationDeleteRequest('comments', 'comment-1')).toEqual({
      url: '/api/admin/comments/comment-1',
      init: {
        method: 'DELETE',
        credentials: 'include',
      },
    });
    expect(buildModerationDeleteRequest('guestbook', 'entry-1').url).toBe('/api/admin/guestbook/entry-1');
  });

  test('normalizes moderation records', () => {
    expect(
      normalizeModerationRecord({
        id: 'comment-1',
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'Reader',
        body: 'Nice.',
        status: 'pending',
        ipHash: 'ip-hash-1',
        userAgent: 'Mozilla/5.0',
        createdAt: '2026-06-10T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'comment-1',
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice.',
      status: 'pending',
      ipHash: 'ip-hash-1',
      userAgent: 'Mozilla/5.0',
      createdAt: '2026-06-10T00:00:00.000Z',
    });
  });
});
