import { describe, expect, test } from 'vitest';

import {
  buildApprovedCommentsRequest,
  buildApprovedGuestbookRequest,
  loadApprovedComments,
  loadApprovedGuestbookEntries,
  normalizePublicComment,
} from './public-comments';

const workerBaseUrl = 'https://interactions.example.workers.dev';

describe('public comment helpers', () => {
  test('does not build approved comment or guestbook requests without a Worker endpoint', () => {
    expect(buildApprovedCommentsRequest('post', 'post-1')).toBeNull();
    expect(buildApprovedGuestbookRequest()).toBeNull();
  });

  test('builds approved comment list requests against the interaction Worker', () => {
    expect(
      buildApprovedCommentsRequest('post', 'post-1', {
        interactionBaseUrl: `${workerBaseUrl}/`,
      }),
    ).toEqual({
      url: `${workerBaseUrl}/comments/post/post-1`,
      init: {
        method: 'GET',
        next: {
          revalidate: 30,
        },
      },
    });
  });

  test('builds approved guestbook list requests against the interaction Worker', () => {
    expect(buildApprovedGuestbookRequest({ interactionBaseUrl: workerBaseUrl })).toEqual({
      url: `${workerBaseUrl}/guestbook`,
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

  test('normalizes public inline comment anchors', () => {
    expect(
      normalizePublicComment({
        id: 'comment-1',
        authorName: 'Reader',
        body: 'Nice writing.',
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
      authorName: 'Reader',
      body: 'Nice writing.',
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

  test('loads approved comments from the interaction Worker', async () => {
    const comments = await loadApprovedComments('post', 'post-1', {
      interactionBaseUrl: workerBaseUrl,
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

  test('loads approved guestbook entries from the interaction Worker', async () => {
    const entries = await loadApprovedGuestbookEntries({
      interactionBaseUrl: workerBaseUrl,
      fetcher: async () =>
        new Response(
          JSON.stringify([
            {
              id: 'entry-1',
              authorName: 'Visitor',
              body: 'Hello from the guestbook.',
              createdAt: '2026-06-10T00:00:00.000Z',
            },
          ]),
        ),
    });

    expect(entries).toEqual([
      {
        id: 'entry-1',
        authorName: 'Visitor',
        body: 'Hello from the guestbook.',
        createdAt: '2026-06-10T00:00:00.000Z',
      },
    ]);
  });

  test('returns no comments when the interaction Worker is absent or unavailable', async () => {
    await expect(loadApprovedComments('post', 'post-1')).resolves.toEqual([]);
    await expect(
      loadApprovedComments('post', 'post-1', {
        interactionBaseUrl: workerBaseUrl,
        fetcher: async () => new Response('Unavailable', { status: 503 }),
      }),
    ).resolves.toEqual([]);
  });

  test('returns no guestbook entries when the interaction Worker is absent or unavailable', async () => {
    await expect(loadApprovedGuestbookEntries()).resolves.toEqual([]);
    await expect(
      loadApprovedGuestbookEntries({
        interactionBaseUrl: workerBaseUrl,
        fetcher: async () => new Response('Unavailable', { status: 503 }),
      }),
    ).resolves.toEqual([]);
  });
});
