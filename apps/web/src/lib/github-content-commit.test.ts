import { describe, expect, test, vi } from 'vitest';

import {
  createGitHubContentCommit,
  getGitHubRepositoryConfig,
  readGitHubTextFile,
  type GitHubRepositoryConfig,
} from './github-content-commit';

const config: GitHubRepositoryConfig = {
  owner: 'aster',
  repo: 'starry-summer',
  branch: 'main',
  token: 'secret-token',
};

describe('github content commit client', () => {
  test('reads repository publishing configuration from environment variables', () => {
    expect(
      getGitHubRepositoryConfig({
        GITHUB_CONTENT_OWNER: 'aster',
        GITHUB_CONTENT_REPO: 'starry-summer',
        GITHUB_CONTENT_BRANCH: 'content',
        GITHUB_CONTENT_TOKEN: 'token',
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({
      owner: 'aster',
      repo: 'starry-summer',
      branch: 'content',
      token: 'token',
    });
    expect(getGitHubRepositoryConfig({} as NodeJS.ProcessEnv)).toBeNull();
  });

  test('reads a text file through the GitHub contents API', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        encoding: 'base64',
        content: Buffer.from('[1,2,3]', 'utf8').toString('base64'),
      }),
    );

    await expect(readGitHubTextFile(config, 'apps/web/content/public-content.json', fetcher)).resolves.toBe('[1,2,3]');
    expect((fetcher.mock.calls as unknown as Array<[string, RequestInit]>)[0]?.[0]).toBe(
      'https://api.github.com/repos/aster/starry-summer/contents/apps/web/content/public-content.json?ref=main',
    );
  });

  test('creates a Git commit for repository content files', async () => {
    const responses = [
      { object: { sha: 'base-commit' } },
      { sha: 'base-commit', tree: { sha: 'base-tree' } },
      { sha: 'blob-1' },
      { sha: 'tree-1' },
      { sha: 'commit-1', html_url: 'https://github.com/aster/starry-summer/commit/commit-1' },
      { ok: true },
    ];
    const fetcher = vi.fn(async (_url, init) => {
      const next = responses.shift();

      if (!next) {
        throw new Error('Unexpected GitHub request');
      }

      expect(init.headers).toMatchObject({
        authorization: 'Bearer secret-token',
      });

      return Response.json(next);
    });

    await expect(
      createGitHubContentCommit(
        {
          message: 'content: publish repo-post',
          files: [{ path: 'apps/web/content/posts/repo-post.md', content: '# Repo Post' }],
        },
        config,
        fetcher,
      ),
    ).resolves.toEqual({
      sha: 'commit-1',
      url: 'https://github.com/aster/starry-summer/commit/commit-1',
    });

    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'https://api.github.com/repos/aster/starry-summer/git/ref/heads/main',
      'https://api.github.com/repos/aster/starry-summer/git/commits/base-commit',
      'https://api.github.com/repos/aster/starry-summer/git/blobs',
      'https://api.github.com/repos/aster/starry-summer/git/trees',
      'https://api.github.com/repos/aster/starry-summer/git/commits',
      'https://api.github.com/repos/aster/starry-summer/git/refs/heads/main',
    ]);
  });

  test('creates base64 blobs for binary repository files', async () => {
    const responses = [
      { object: { sha: 'base-commit' } },
      { sha: 'base-commit', tree: { sha: 'base-tree' } },
      { sha: 'image-blob' },
      { sha: 'index-blob' },
      { sha: 'tree-1' },
      { sha: 'commit-1' },
      { ok: true },
    ];
    const blobBodies: unknown[] = [];
    const fetcher = vi.fn(async (url, init) => {
      const next = responses.shift();

      if (!next) {
        throw new Error('Unexpected GitHub request');
      }

      if (String(url).endsWith('/git/blobs')) {
        blobBodies.push(JSON.parse(String(init.body)));
      }

      return Response.json(next);
    });

    await createGitHubContentCommit(
      {
        message: 'assets: upload cover.png',
        files: [
          {
            path: 'apps/web/public/images/uploads/cover.png',
            content: 'aGVsbG8=',
            encoding: 'base64',
          },
          {
            path: 'apps/web/content/assets.json',
            content: '[]\n',
          },
        ],
      },
      config,
      fetcher,
    );

    expect(blobBodies).toEqual([
      {
        content: 'aGVsbG8=',
        encoding: 'base64',
      },
      {
        content: '[]\n',
        encoding: 'utf-8',
      },
    ]);
  });
});
