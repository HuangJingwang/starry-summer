import { describe, expect, test, vi } from 'vitest';

import {
  buildLeetCodeRecentSubmissionsRequest,
  loadLeetCodeRecentSubmissions,
  normalizeLeetCodeSubmission,
} from './leetcode';

describe('leetcode recent submissions', () => {
  test('builds a GraphQL request for recent public submissions', () => {
    const request = buildLeetCodeRecentSubmissionsRequest({ username: 'summer', limit: 5 });

    expect(request.url).toBe('https://leetcode.cn/graphql');
    expect(request.init.method).toBe('POST');
    expect(request.init.headers).toEqual({
      'content-type': 'application/json',
      referer: 'https://leetcode.cn/',
    });
    expect(JSON.parse(String(request.init.body))).toMatchObject({
      variables: {
        username: 'summer',
        limit: 5,
      },
    });
  });

  test('normalizes LeetCode submission payloads for the home page', () => {
    expect(
      normalizeLeetCodeSubmission({
        title: 'Two Sum',
        titleSlug: 'two-sum',
        timestamp: '1781126400',
        statusDisplay: 'Accepted',
        lang: 'TypeScript',
      }),
    ).toEqual({
      title: 'Two Sum',
      titleSlug: 'two-sum',
      status: 'Accepted',
      language: 'TypeScript',
      submittedAt: '2026-06-10T21:20:00.000Z',
      submittedAtLabel: '2026-06-10',
      problemUrl: 'https://leetcode.cn/problems/two-sum/',
    });
  });

  test('loads recent submissions when a username is configured', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        data: {
          recentSubmissionList: [
            {
              title: 'Valid Palindrome',
              titleSlug: 'valid-palindrome',
              timestamp: '1781126400',
              statusDisplay: 'Accepted',
              lang: 'JavaScript',
            },
          ],
        },
      }),
    );

    await expect(loadLeetCodeRecentSubmissions({ username: 'summer', limit: 3 }, fetcher)).resolves.toEqual([
      expect.objectContaining({
        title: 'Valid Palindrome',
        status: 'Accepted',
        language: 'JavaScript',
        problemUrl: 'https://leetcode.cn/problems/valid-palindrome/',
      }),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('returns an empty list when LeetCode responds with an error', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 502 }));

    await expect(loadLeetCodeRecentSubmissions({ username: 'summer' }, fetcher)).resolves.toEqual([]);
  });

  test('does not request LeetCode when username is blank', async () => {
    const fetcher = vi.fn();

    await expect(loadLeetCodeRecentSubmissions({ username: '   ' }, fetcher)).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
