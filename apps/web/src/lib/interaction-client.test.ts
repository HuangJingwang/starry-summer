import { describe, expect, test } from 'vitest';

import { buildCommentRequest, buildGuestbookRequest, buildLikeRequest } from './interaction-client';

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
});
