import { describe, expect, test } from 'vitest';

import {
  buildAdminModerationListRequest,
  buildCommentRequest,
  buildDedupedLikeRequest,
  buildDedupedViewRequest,
  buildGuestbookRequest,
  buildLikeRequest,
  buildModerationActionRequest,
  buildModerationDeleteRequest,
  buildViewRequest,
  createPersistentInteractionSeenStore,
  loadAdminModerationCount,
  normalizeModerationRecord,
  PUBLIC_SUBMISSION_LIMITS,
  readInteractionErrorMessage,
} from './interaction-client';

const workerBaseUrl = 'https://interactions.example.workers.dev';

describe('interaction client helpers', () => {
  test('exposes public submission field limits that match the Worker validation contract', () => {
    expect(PUBLIC_SUBMISSION_LIMITS).toEqual({
      authorName: 80,
      body: 2000,
    });
  });

  test('does not build local database API requests when the interaction Worker is not configured', () => {
    expect(buildLikeRequest('post', 'post-1')).toBeNull();
    expect(buildViewRequest('post', 'post-1')).toBeNull();
    expect(buildCommentRequest({ targetType: 'post', targetId: 'post-1', body: 'Nice' })).toBeNull();
    expect(buildGuestbookRequest({ body: 'Hello' })).toBeNull();
    expect(buildAdminModerationListRequest('comments')).toBeNull();
    expect(buildModerationActionRequest('comments', 'comment-1', 'approved')).toBeNull();
    expect(buildModerationDeleteRequest('comments', 'comment-1')).toBeNull();
  });

  test('builds public interaction requests against the Worker endpoint', () => {
    expect(buildLikeRequest('post', 'post-1', { interactionBaseUrl: workerBaseUrl })).toEqual({
      url: `${workerBaseUrl}/likes/post/post-1`,
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      },
    });
    expect(buildViewRequest('post', 'post-1', { interactionBaseUrl: `${workerBaseUrl}/` })?.url).toBe(
      `${workerBaseUrl}/views/post/post-1`,
    );
    expect(buildCommentRequest({ targetType: 'post', targetId: 'post-1', body: 'Nice' }, { interactionBaseUrl: workerBaseUrl })?.url).toBe(
      `${workerBaseUrl}/comments`,
    );
    expect(buildGuestbookRequest({ body: 'Hello' }, { interactionBaseUrl: workerBaseUrl })?.url).toBe(
      `${workerBaseUrl}/guestbook`,
    );
  });

  test('builds view and like requests only once per local target when a Worker is configured', () => {
    const seenViews = new Set<string>();
    const seenLikes = new Set<string>();
    const options = { interactionBaseUrl: workerBaseUrl };

    expect(buildDedupedViewRequest('post', 'post-1', seenViews, options)).toEqual(buildViewRequest('post', 'post-1', options));
    expect(buildDedupedViewRequest('post', 'post-1', seenViews, options)).toBeNull();
    expect(buildDedupedLikeRequest('post', 'post-1', seenLikes, options)).toEqual(buildLikeRequest('post', 'post-1', options));
    expect(buildDedupedLikeRequest('post', 'post-1', seenLikes, options)).toBeNull();
  });

  test('does not mark seen interactions when no Worker request can be built', () => {
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
    expect(buildDedupedLikeRequest('post', 'post-2', seen)).toBeNull();
    expect(writes).toEqual([]);
  });

  test('persists seen likes across browser reloads after a Worker request is built', () => {
    const writes: string[] = [];
    const storage = {
      getItem: (key: string) =>
        key === 'starry-summer:seen-interactions' ? JSON.stringify(['like:post:post-1']) : null,
      setItem: (_key: string, value: string) => {
        writes.push(value);
      },
    };
    const seen = createPersistentInteractionSeenStore(new Set<string>(), storage);

    expect(buildDedupedLikeRequest('post', 'post-1', seen, { interactionBaseUrl: workerBaseUrl })).toBeNull();
    expect(buildDedupedLikeRequest('post', 'post-2', seen, { interactionBaseUrl: workerBaseUrl })).toEqual(
      buildLikeRequest('post', 'post-2', { interactionBaseUrl: workerBaseUrl }),
    );
    expect(JSON.parse(writes.at(-1) ?? '[]')).toEqual(['like:post:post-1', 'like:post:post-2']);
  });

  test('builds comment and guestbook request bodies for the Worker', () => {
    expect(
      buildCommentRequest(
        {
          targetType: 'post',
          targetId: 'post-1',
          body: ' Nice post. ',
        },
        { interactionBaseUrl: workerBaseUrl },
      ),
    ).toEqual({
      url: `${workerBaseUrl}/comments`,
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
    expect(buildGuestbookRequest({ body: ' Hello. ' }, { interactionBaseUrl: workerBaseUrl })?.init.body).toBe(
      JSON.stringify({
        body: 'Hello.',
      }),
    );
  });

  test('builds anchored inline comment request bodies', () => {
    expect(
      buildCommentRequest(
        {
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
        },
        { interactionBaseUrl: workerBaseUrl },
      )?.init.body,
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

  test('builds admin moderation requests against the Worker endpoint', () => {
    expect(
      buildAdminModerationListRequest('comments', 'pending', {
        interactionBaseUrl: `${workerBaseUrl}/`,
        cookieHeader: 'ss_session=session-token',
      }),
    ).toEqual({
      url: `${workerBaseUrl}/admin/comments?status=pending`,
      init: {
        method: 'GET',
        credentials: 'include',
        headers: {
          cookie: 'ss_session=session-token',
        },
      },
    });
    expect(buildAdminModerationListRequest('guestbook', 'pending', { interactionBaseUrl: workerBaseUrl })?.url).toBe(
      `${workerBaseUrl}/admin/guestbook?status=pending`,
    );
    expect(buildModerationActionRequest('comments', 'comment-1', 'approved', { interactionBaseUrl: workerBaseUrl })?.url).toBe(
      `${workerBaseUrl}/admin/comments/comment-1/moderate`,
    );
    expect(buildModerationDeleteRequest('guestbook', 'entry-1', { interactionBaseUrl: workerBaseUrl })?.url).toBe(
      `${workerBaseUrl}/admin/guestbook/entry-1`,
    );
  });

  test('loads moderation counts with fallback when the Worker is absent or unavailable', async () => {
    await expect(loadAdminModerationCount('comments', 'pending')).resolves.toBe(0);
    await expect(
      loadAdminModerationCount('comments', 'pending', {
        interactionBaseUrl: workerBaseUrl,
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
        interactionBaseUrl: workerBaseUrl,
        fetcher: async () => new Response('Unauthorized', { status: 401 }),
      }),
    ).resolves.toBe(0);
  });

  test('reads specific interaction Worker error messages', async () => {
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
