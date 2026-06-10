import { describe, expect, test } from 'vitest';

import {
  buildAdminModerationListRequest,
  buildCommentRequest,
  buildGuestbookRequest,
  buildLikeRequest,
  buildModerationActionRequest,
  normalizeModerationRecord,
} from './interaction-client';

describe('interaction client helpers', () => {
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

  test('builds guestbook request', () => {
    expect(buildGuestbookRequest({ authorName: ' Visitor ', body: ' Hello. ' }).init.body).toBe(
      JSON.stringify({
        authorName: 'Visitor',
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

  test('normalizes moderation records', () => {
    expect(
      normalizeModerationRecord({
        id: 'comment-1',
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'Reader',
        body: 'Nice.',
        status: 'pending',
        createdAt: '2026-06-10T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'comment-1',
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice.',
      status: 'pending',
      createdAt: '2026-06-10T00:00:00.000Z',
    });
  });
});
