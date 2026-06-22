export interface GitHubRepositoryConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export interface GitHubCommitFile {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export interface GitHubContentCommitInput {
  message: string;
  files: GitHubCommitFile[];
}

export interface GitHubContentCommitResult {
  sha: string;
  url: string;
}

export type GitHubFetcher = (url: string, init: RequestInit) => Promise<Response>;

interface GitHubRefResponse {
  object: {
    sha: string;
  };
}

interface GitHubCommitResponse {
  sha: string;
  tree: {
    sha: string;
  };
}

interface GitHubBlobResponse {
  sha: string;
}

interface GitHubTreeResponse {
  sha: string;
}

interface GitHubCreatedCommitResponse {
  sha: string;
  html_url?: string;
}

interface GitHubContentsResponse {
  content?: string;
  encoding?: string;
}

export function getGitHubRepositoryConfig(env: NodeJS.ProcessEnv = process.env): GitHubRepositoryConfig | null {
  const owner = env.GITHUB_CONTENT_OWNER?.trim();
  const repo = env.GITHUB_CONTENT_REPO?.trim();
  const token = env.GITHUB_CONTENT_TOKEN?.trim();

  if (!owner || !repo || !token) {
    return null;
  }

  return {
    owner,
    repo,
    token,
    branch: env.GITHUB_CONTENT_BRANCH?.trim() || 'main',
  };
}

export async function readGitHubTextFile(
  config: GitHubRepositoryConfig,
  path: string,
  fetcher: GitHubFetcher = fetch,
): Promise<string> {
  const data = await githubJson<GitHubContentsResponse>(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(config.branch)}`,
    { method: 'GET' },
    fetcher,
  );

  if (data.encoding !== 'base64' || !data.content) {
    throw new Error(`GitHub file ${path} is not a base64 text file.`);
  }

  return Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf8');
}

export async function createGitHubContentCommit(
  input: GitHubContentCommitInput,
  config: GitHubRepositoryConfig,
  fetcher: GitHubFetcher = fetch,
): Promise<GitHubContentCommitResult> {
  const uniqueFiles = dedupeCommitFiles(input.files);
  const ref = await githubJson<GitHubRefResponse>(
    config,
    `/repos/${config.owner}/${config.repo}/git/ref/heads/${encodeURIComponent(config.branch)}`,
    { method: 'GET' },
    fetcher,
  );
  const baseCommit = await githubJson<GitHubCommitResponse>(
    config,
    `/repos/${config.owner}/${config.repo}/git/commits/${ref.object.sha}`,
    { method: 'GET' },
    fetcher,
  );
  const blobs = await Promise.all(
    uniqueFiles.map(async (file) => ({
      file,
      blob: await githubJson<GitHubBlobResponse>(
        config,
        `/repos/${config.owner}/${config.repo}/git/blobs`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: file.content,
            encoding: file.encoding ?? 'utf-8',
          }),
        },
        fetcher,
      ),
    })),
  );
  const tree = await githubJson<GitHubTreeResponse>(
    config,
    `/repos/${config.owner}/${config.repo}/git/trees`,
    {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseCommit.tree.sha,
        tree: blobs.map(({ file, blob }) => ({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        })),
      }),
    },
    fetcher,
  );
  const commit = await githubJson<GitHubCreatedCommitResponse>(
    config,
    `/repos/${config.owner}/${config.repo}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({
        message: input.message,
        tree: tree.sha,
        parents: [ref.object.sha],
      }),
    },
    fetcher,
  );

  await githubJson(
    config,
    `/repos/${config.owner}/${config.repo}/git/refs/heads/${encodeURIComponent(config.branch)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        sha: commit.sha,
      }),
    },
    fetcher,
  );

  return {
    sha: commit.sha,
    url: commit.html_url ?? `https://github.com/${config.owner}/${config.repo}/commit/${commit.sha}`,
  };
}

async function githubJson<T = unknown>(
  config: GitHubRepositoryConfig,
  path: string,
  init: RequestInit,
  fetcher: GitHubFetcher,
): Promise<T> {
  const response = await fetcher(`https://api.github.com${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${config.token}`,
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function dedupeCommitFiles(files: GitHubCommitFile[]): GitHubCommitFile[] {
  const byPath = new Map<string, GitHubCommitFile>();

  for (const file of files) {
    byPath.set(file.path, file);
  }

  return [...byPath.values()];
}

function encodeURIComponentPath(path: string): string {
  return path.split('/').map((part) => encodeURIComponent(part)).join('/');
}
