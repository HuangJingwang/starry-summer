import { describe, expect, test } from 'vitest';

import { buildReaderSessionRequest, loadReaderSession } from './reader-auth';

describe('reader auth helpers', () => {
  test('builds a credentialed reader session request', () => {
    expect(buildReaderSessionRequest({ apiBaseUrl: 'https://api.example.com/', cookieHeader: 'ss_reader=token' })).toEqual({
      url: 'https://api.example.com/auth/reader',
      init: {
        method: 'GET',
        credentials: 'include',
        headers: {
          cookie: 'ss_reader=token',
        },
      },
    });
  });

  test('loads authenticated reader sessions with an unauthenticated fallback', async () => {
    await expect(
      loadReaderSession({
        fetcher: async () =>
          new Response(
            JSON.stringify({
              authenticated: true,
              provider: 'github',
              login: 'reader',
              displayName: 'Reader',
              profileUrl: 'https://github.com/reader',
            }),
          ),
      }),
    ).resolves.toMatchObject({
      authenticated: true,
      login: 'reader',
      displayName: 'Reader',
    });

    await expect(
      loadReaderSession({
        fetcher: async () => new Response('Unauthorized', { status: 401 }),
      }),
    ).resolves.toEqual({ authenticated: false });
  });
});
