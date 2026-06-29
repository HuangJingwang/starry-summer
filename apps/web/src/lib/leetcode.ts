export interface LeetCodeRecentSubmissionsOptions {
  username?: string;
  limit?: number;
  timeoutMs?: number;
}

export interface LeetCodeRequest {
  url: string;
  init: RequestInit & { next?: { revalidate: number } };
}

export interface LeetCodeSubmissionPayload {
  title?: string;
  titleSlug?: string;
  timestamp?: string | number;
  statusDisplay?: string;
  lang?: string;
}

export interface LeetCodeRecentSubmission {
  title: string;
  titleSlug: string;
  status: string;
  language: string;
  submittedAt: string;
  submittedAtLabel: string;
  problemUrl: string;
}

interface LeetCodeRecentSubmissionsResponse {
  data?: {
    recentSubmissionList?: LeetCodeSubmissionPayload[];
  };
}

const LEETCODE_GRAPHQL_URL = 'https://leetcode.cn/graphql';
const DEFAULT_LIMIT = 6;

export function buildLeetCodeRecentSubmissionsRequest(options: LeetCodeRecentSubmissionsOptions): LeetCodeRequest {
  const limit = normalizeLimit(options.limit);

  return {
    url: LEETCODE_GRAPHQL_URL,
    init: {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        referer: 'https://leetcode.cn/',
      },
      body: JSON.stringify({
        query: `
          query recentSubmissions($username: String!, $limit: Int!) {
            recentSubmissionList(username: $username, limit: $limit) {
              title
              titleSlug
              timestamp
              statusDisplay
              lang
            }
          }
        `,
        variables: {
          username: options.username?.trim() ?? '',
          limit,
        },
      }),
      next: {
        revalidate: 300,
      },
    },
  };
}

export async function loadLeetCodeRecentSubmissions(
  options: LeetCodeRecentSubmissionsOptions = {},
  fetcher: (url: string, init: RequestInit) => Promise<Response> = (url, init) => fetch(url, init),
): Promise<LeetCodeRecentSubmission[]> {
  const username = options.username?.trim();

  if (!username) {
    return [];
  }

  const request = buildLeetCodeRecentSubmissionsRequest({ ...options, username });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 1_500);

  try {
    const response = await fetcher(request.url, { ...request.init, signal: controller.signal });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as LeetCodeRecentSubmissionsResponse;
    const submissions = data.data?.recentSubmissionList;

    if (!Array.isArray(submissions)) {
      return [];
    }

    return submissions.map((submission) => normalizeLeetCodeSubmission(submission)).filter(isLeetCodeSubmission);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeLeetCodeSubmission(input: LeetCodeSubmissionPayload): LeetCodeRecentSubmission | null {
  const title = input.title?.trim();
  const titleSlug = input.titleSlug?.trim();
  const timestamp = Number(input.timestamp);

  if (!title || !titleSlug || !Number.isFinite(timestamp)) {
    return null;
  }

  const submittedAt = new Date(timestamp * 1000);

  return {
    title,
    titleSlug,
    status: input.statusDisplay?.trim() || 'Submitted',
    language: input.lang?.trim() || 'Unknown',
    submittedAt: submittedAt.toISOString(),
    submittedAtLabel: submittedAt.toISOString().slice(0, 10),
    problemUrl: `https://leetcode.cn/problems/${titleSlug}/`,
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(20, Math.max(1, Math.floor(limit)));
}

function isLeetCodeSubmission(
  submission: LeetCodeRecentSubmission | null,
): submission is LeetCodeRecentSubmission {
  return submission !== null;
}
