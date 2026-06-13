import { describe, expect, test } from 'vitest';

import {
  buildAdminModerationListRequest,
  buildCommentRequest,
  buildGuestbookRequest,
  buildDedupedLikeRequest,
  buildDedupedViewRequest,
  createPersistentInteractionSeenStore,
  buildLikeRequest,
  buildModerationActionRequest,
  buildModerationDeleteRequest,
  buildViewRequest,
  loadAdminModerationCount,
  normalizeModerationRecord,
  PUBLIC_SUBMISSION_LIMITS,
  readInteractionErrorMessage,
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

  test('persists seen likes across browser reloads', () => {
    const writes: string[] = [];
    const storage = {
      getItem: (key: string) =>
        key === 'starry-summer:seen-interactions' ? JSON.stringify(['like:post:post-1']) : null,
      setItem: (_key: string, value: string) => {
        writes.push(value);
      },
    };
    const seen = createPersistentInteractionSeenStore(new Set<string>(), storage);

    expect(buildDedupedLikeRequest('post', 'post-1', seen)).toBeNull();
    expect(buildDedupedLikeRequest('post', 'post-2', seen)).toEqual(buildLikeRequest('post', 'post-2'));
    expect(JSON.parse(writes.at(-1) ?? '[]')).toEqual(['like:post:post-1', 'like:post:post-2']);
  });

  test('builds comment request', () => {
    expect(
      buildCommentRequest({
        targetType: 'post',
        targetId: 'post-1',
        body: ' Nice post. ',
      }),
    ).toEqual({
      url: '/api/comments',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetType: 'post',
          targetId: 'post-1',
          body: 'Nice post.',
        }),
      },
    });
    expect(buildCommentRequest({ targetType: 'post', targetId: 'post-1', body: ' Nice post. ' }).init.body).toBe(
      JSON.stringify({
        targetType: 'post',
        targetId: 'post-1',
        body: 'Nice post.',
      }),
    );
  });

  test('builds anchored inline comment request', () => {
    expect(
      buildCommentRequest({
        targetType: 'post',
        targetId: 'post-1',
        body: ' Inline note. ',
        anchor: {
          text: 'selected passage',
          prefix: 'before',
          suffix: 'after',
          start: 12,
          end: 28,
          hash: 'a'.repeat(64),
        },
      }).init.body,
    ).toBe(
      JSON.stringify({
        targetType: 'post',
        targetId: 'post-1',
        body: 'Inline note.',
        anchor: {
          text: 'selected passage',
          prefix: 'before',
          suffix: 'after',
          start: 12,
          end: 28,
          hash: 'a'.repeat(64),
        },
      }),
    );
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

  test('reads specific interaction API error messages', async () => {
    await expect(
      readInteractionErrorMessage(
        new Response(JSON.stringify({ message: 'Comment was already moderated' }), {
          status: 409,
          headers: { 'content-type': 'application/json' },
        }),
        '操作失败。',
      ),
    ).resolves.toBe('Comment was already moderated');

    await expect(
      readInteractionErrorMessage(
        new Response(JSON.stringify({ message: ['Reader session is required'] }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
        '操作失败。',
      ),
    ).resolves.toBe('Reader session is required');
  });

  test('falls back to a friendly interaction error when response has no readable message', async () => {
    await expect(readInteractionErrorMessage(new Response('', { status: 500 }), '操作失败。')).resolves.toBe('操作失败。');
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

  test('normalizes moderation records with inline anchors', () => {
    expect(
      normalizeModerationRecord({
        id: 'comment-1',
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'Reader',
        body: 'Nice.',
        status: 'pending',
        createdAt: '2026-06-10T00:00:00.000Z',
        anchor: {
          text: 'selected passage',
          prefix: 'before',
          suffix: 'after',
          start: 12,
          end: 28,
          hash: 'a'.repeat(64),
        },
      }),
    ).toEqual({
      id: 'comment-1',
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice.',
      status: 'pending',
      createdAt: '2026-06-10T00:00:00.000Z',
      anchor: {
        text: 'selected passage',
        prefix: 'before',
        suffix: 'after',
        start: 12,
        end: 28,
        hash: 'a'.repeat(64),
      },
    });
  });
});
