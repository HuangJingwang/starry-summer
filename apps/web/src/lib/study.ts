import {
  DEFAULT_STUDY_PROBLEMS,
  DEFAULT_STUDY_SETTINGS,
  type StudyDashboard,
  type StudyProblemPatch,
  type StudyReportPeriod,
  type StudySettingsPatch,
} from '@starry-summer/shared';

export interface StudyRequest {
  url: string;
  init: RequestInit & { next?: { revalidate: number } };
}

export interface PublicStudyRequestOptions {
  apiBaseUrl?: string;
}

export interface PublicStudyLoadOptions extends PublicStudyRequestOptions {
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
  timeoutMs?: number;
}

export interface StudyLoadResult {
  source: 'api' | 'repository-file' | 'fallback';
  dashboard: StudyDashboard;
}

const fallbackStudyProblems = DEFAULT_STUDY_PROBLEMS.filter((problem) => problem.listIds.includes('hot100')).map((problem, index) => ({
  ...problem,
  rounds: index < 3 ? ['2026-06-08', '2026-06-12'] : index < 8 ? ['2026-06-10'] : [],
  notes: index < 4 ? `${problem.category} 复盘：记录关键状态、边界条件和下一轮重点。` : '',
  updatedAt: index < 8 ? '2026-06-12' : '',
}));

const fallbackStudyDashboard = normalizeStudyDashboard({
  settings: DEFAULT_STUDY_SETTINGS,
  summary: {
    totalProblems: fallbackStudyProblems.length,
    startedProblems: fallbackStudyProblems.filter((problem) => problem.rounds.length > 0).length,
    completedProblems: 0,
    doneRounds: fallbackStudyProblems.reduce((total, problem) => total + problem.rounds.length, 0),
    totalRounds: fallbackStudyProblems.length * DEFAULT_STUDY_SETTINGS.roundCount,
    completionRate: (fallbackStudyProblems.reduce((total, problem) => total + problem.rounds.length, 0) / (fallbackStudyProblems.length * DEFAULT_STUDY_SETTINGS.roundCount)) * 100,
    streak: 2,
    totalDays: 12,
    lastActivityDate: '2026-06-12',
  },
  categories: buildFallbackCategories(fallbackStudyProblems),
  problems: fallbackStudyProblems,
  todayFocus: fallbackStudyProblems.slice(0, 3),
  reviewDue: fallbackStudyProblems.slice(3, 6).map((problem, index) => ({
    ...problem,
    nextRound: `R${index + 2}`,
    dueDate: '2026-06-12',
    overdueDays: index,
    forcedByMustRepeat: false,
  })),
  heatmap: buildFallbackHeatmap(),
  recentSubmissions: [],
  recentNotes: fallbackStudyProblems.filter((problem) => problem.notes).slice(0, 4),
});

export function buildPublicStudyRequest(options: PublicStudyRequestOptions = {}): StudyRequest | null {
  const configuredBaseUrl = options.apiBaseUrl?.trim();

  if (!configuredBaseUrl) {
    return null;
  }

  const baseUrl = configuredBaseUrl.replace(/\/$/, '');

  return {
    url: `${baseUrl}/study`,
    init: {
      method: 'GET',
      next: {
        revalidate: 60,
      },
    },
  };
}

export function buildAdminStudyRequest(): StudyRequest {
  return {
    url: '/api/admin/study',
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildUpdateStudySettingsRequest(input: StudySettingsPatch): StudyRequest {
  return {
    url: '/api/admin/study/settings',
    init: {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  };
}

export function buildSyncStudyRequest(): StudyRequest {
  return {
    url: '/api/admin/study/sync',
    init: {
      method: 'POST',
      credentials: 'include',
    },
  };
}

export function buildUpdateStudyProblemRequest(slug: string, input: StudyProblemPatch): StudyRequest {
  return {
    url: `/api/admin/study/problems/${slug}`,
    init: {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  };
}

export function buildStudyProblemDraftRequest(slug: string): StudyRequest {
  return {
    url: `/api/admin/study/problems/${slug}/draft`,
    init: {
      method: 'POST',
      credentials: 'include',
    },
  };
}

export function buildStudyReportDraftRequest(period: StudyReportPeriod): StudyRequest {
  return {
    url: '/api/admin/study/reports',
    init: {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ period }),
    },
  };
}

export async function readStudyErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { message?: unknown; error?: unknown };
      const message = normalizeStudyErrorMessage(data.message) || normalizeStudyErrorMessage(data.error);

      return message || fallback;
    }

    const text = (await response.text()).trim();

    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function loadPublicStudyDashboard(options: PublicStudyLoadOptions = {}): Promise<StudyLoadResult> {
  if (!options.fetcher && !options.apiBaseUrl && typeof window === 'undefined') {
    return { source: 'fallback', dashboard: fallbackStudyDashboard };
  }

  const request = buildPublicStudyRequest(options);

  if (!request) {
    return { source: 'fallback', dashboard: fallbackStudyDashboard };
  }

  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 1_500);

  try {
    const response = await fetcher(request.url, { ...request.init, signal: controller.signal });

    if (!response.ok) {
      return { source: 'fallback', dashboard: fallbackStudyDashboard };
    }

    return {
      source: 'api',
      dashboard: normalizeStudyDashboard((await response.json()) as Partial<StudyDashboard>),
    };
  } catch {
    return { source: 'fallback', dashboard: fallbackStudyDashboard };
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadAdminStudyDashboard(
  fetcher: (url: string, init: RequestInit) => Promise<Response> = (url, init) => fetch(url, init),
): Promise<StudyLoadResult> {
  const request = buildAdminStudyRequest();

  try {
    const response = await fetcher(request.url, request.init);

    if (!response.ok) {
      return { source: 'fallback', dashboard: fallbackStudyDashboard };
    }

    return {
      source: 'api',
      dashboard: normalizeStudyDashboard((await response.json()) as Partial<StudyDashboard>),
    };
  } catch {
    return { source: 'fallback', dashboard: fallbackStudyDashboard };
  }
}

export function normalizeStudyDashboard(input: Partial<StudyDashboard>): StudyDashboard {
  const settings = {
    ...DEFAULT_STUDY_SETTINGS,
    ...(input.settings ?? {}),
    reviewIntervals: Array.isArray(input.settings?.reviewIntervals)
      ? input.settings.reviewIntervals
      : DEFAULT_STUDY_SETTINGS.reviewIntervals,
  };
  const summary = {
    totalProblems: normalizeNumber(input.summary?.totalProblems),
    startedProblems: normalizeNumber(input.summary?.startedProblems),
    completedProblems: normalizeNumber(input.summary?.completedProblems),
    doneRounds: normalizeNumber(input.summary?.doneRounds),
    totalRounds: normalizeNumber(input.summary?.totalRounds),
    completionRate: Math.round(normalizeNumber(input.summary?.completionRate) * 10) / 10,
    streak: normalizeNumber(input.summary?.streak),
    totalDays: normalizeNumber(input.summary?.totalDays),
    lastActivityDate: input.summary?.lastActivityDate?.slice(0, 10) ?? '',
  };

  return {
    settings,
    summary,
    categories: Array.isArray(input.categories) ? input.categories : [],
    problems: Array.isArray(input.problems) ? input.problems : [],
    todayFocus: Array.isArray(input.todayFocus) ? input.todayFocus : [],
    reviewDue: Array.isArray(input.reviewDue) ? input.reviewDue : [],
    heatmap: Array.isArray(input.heatmap) ? input.heatmap : [],
    recentSubmissions: Array.isArray(input.recentSubmissions) ? input.recentSubmissions : [],
    recentNotes: Array.isArray(input.recentNotes) ? input.recentNotes : [],
  };
}

function normalizeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function normalizeStudyErrorMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join('；');
  }

  return '';
}

function buildFallbackCategories(problems: typeof DEFAULT_STUDY_PROBLEMS) {
  const grouped = new Map<string, typeof DEFAULT_STUDY_PROBLEMS>();

  for (const problem of problems) {
    grouped.set(problem.category, [...(grouped.get(problem.category) ?? []), problem]);
  }

  return Array.from(grouped.entries()).map(([name, group]) => {
    const started = group.filter((problem) => problem.rounds.length > 0).length;

    return {
      name,
      total: group.length,
      started,
      completed: 0,
      rate: group.length > 0 ? Math.round((started / group.length) * 1000) / 10 : 0,
    };
  });
}

function buildFallbackHeatmap() {
  return Array.from({ length: 28 }, (_, index) => ({
    date: `2026-06-${String(index + 1).padStart(2, '0')}`,
    count: index % 6 === 0 ? 0 : (index % 4) + 1,
  }));
}
