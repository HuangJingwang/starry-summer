import { describe, expect, test } from 'vitest';

import {
  buildApprovedCommentsRequest,
  loadApprovedComments,
  normalizePublicComment,
} from './public-comments';

describe('public comment helpers', () => {
  test('builds approved comment list requests', () => {
    expect(
      buildApprovedCommentsRequest('post', 'post-1', {
        apiBaseUrl: 'https://api.example.com/',
      }),
    ).toEqual({
      url: 'https://api.example.com/comments/post/post-1',
      init: {
        method: 'GET',
        next: {
          revalidate: 30,
        },
      },
    });
  });

  test('normalizes public comment records', () => {
    expect(
      normalizePublicComment({
        id: 'comment-1',
        authorName: 'Reader',
        body: 'Nice writing.',
        createdAt: '2026-06-10T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'comment-1',
      authorName: 'Reader',
      body: 'Nice writing.',
      createdAt: '2026-06-10T00:00:00.000Z',
    });
  });

  test('loads approved comments from the API', async () => {
    const comments = await loadApprovedComments('post', 'post-1', {
      apiBaseUrl: 'https://api.example.com',
      fetcher: async () =>
        new Response(
          JSON.stringify([
            {
              id: 'comment-1',
              authorName: 'Reader',
              body: 'Nice writing.',
              createdAt: '2026-06-10T00:00:00.000Z',
            },
          ]),
        ),
    });

    expect(comments).toEqual([
      {
        id: 'comment-1',
        authorName: 'Reader',
        body: 'Nice writing.',
        createdAt: '2026-06-10T00:00:00.000Z',
      },
    ]);
  });

  test('returns no comments when the comments API is unavailable', async () => {
    await expect(
      loadApprovedComments('post', 'post-1', {
        fetcher: async () => new Response('Unavailable', { status: 503 }),
      }),
    ).resolves.toEqual([]);
  });
});
