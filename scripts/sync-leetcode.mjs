import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const defaultDashboardPath = 'apps/web/content/leetcode/dashboard.json';
const leetcodeCnGraphqlUrl = 'https://leetcode.cn/graphql/';
const leetcodeCnNojGraphqlUrl = 'https://leetcode.cn/graphql/noj-go/';

const progressQuery = `
  query userSessionProgress($userSlug: String!) {
    userProfileUserQuestionSubmitStats(userSlug: $userSlug) {
      acSubmissionNum {
        difficulty
        count
      }
      totalSubmissionNum {
        difficulty
        count
      }
    }
    userProfileUserQuestionProgress(userSlug: $userSlug) {
      numAcceptedQuestions {
        difficulty
        count
      }
      numFailedQuestions {
        difficulty
        count
      }
      numUntouchedQuestions {
        difficulty
        count
      }
    }
  }
`;

const recentAcceptedSubmissionsQuery = `
  query recentAcSubmissions($userSlug: String!) {
    recentACSubmissions(userSlug: $userSlug) {
      submissionId
      submitTime
      question {
        title
        translatedTitle
        titleSlug
        questionFrontendId
      }
    }
  }
`;

const calendarQuery = `
  query userProfileCalendar($userSlug: String!, $year: Int) {
    userCalendar(userSlug: $userSlug, year: $year) {
      streak
      totalActiveDays
      submissionCalendar
      activeYears
      recentStreak
    }
  }
`;

export async function fetchLeetCodeCnProgress(username, fetcher = fetch) {
  const [progress, recent, calendar] = await Promise.all([
    requestLeetCodeGraphql({
      endpoint: leetcodeCnGraphqlUrl,
      operationName: 'userSessionProgress',
      query: progressQuery,
      variables: { userSlug: username },
      username,
      fetcher,
    }),
    requestLeetCodeGraphql({
      endpoint: leetcodeCnNojGraphqlUrl,
      operationName: 'recentAcSubmissions',
      query: recentAcceptedSubmissionsQuery,
      variables: { userSlug: username },
      username,
      fetcher,
    }),
    requestLeetCodeGraphql({
      endpoint: leetcodeCnNojGraphqlUrl,
      operationName: 'userProfileCalendar',
      query: calendarQuery,
      variables: { userSlug: username },
      username,
      fetcher,
    }),
  ]);

  return {
    progress: progress.userProfileUserQuestionProgress,
    submitStats: progress.userProfileUserQuestionSubmitStats,
    recentAcceptedSubmissions: Array.isArray(recent.recentACSubmissions) ? recent.recentACSubmissions : [],
    calendar: calendar.userCalendar ?? {},
  };
}

export function mergeLeetCodeCnProgress(dashboard, input) {
  const username = input.username.trim();
  const settings = {
    ...dashboard.settings,
    leetcodeUsername: username,
    updatedAt: input.syncDate,
  };
  const heatmap = buildHeatmap(input.calendar?.submissionCalendar);
  const lastActivityDate = heatmap.at(-1)?.date ?? dashboard.summary?.lastActivityDate ?? '';
  const recentSubmissions = normalizeRecentAcceptedSubmissions(input.recentAcceptedSubmissions);
  const roundsBySlug = buildRecentAcceptedRounds(recentSubmissions);
  const problems = dashboard.problems.map((problem) => {
    const nextRounds = mergeRounds(problem.rounds, roundsBySlug.get(problem.slug), settings.roundCount);

    return {
      ...problem,
      rounds: nextRounds,
      updatedAt: nextRounds.at(-1) ?? problem.updatedAt,
    };
  });
  const categories = buildCategories(problems, settings.roundCount);
  const summary = buildSummary({
    calendar: input.calendar,
    lastActivityDate,
    problems,
    roundCount: settings.roundCount,
  });

  return {
    ...dashboard,
    settings,
    summary,
    categories,
    problems,
    reviewDue: buildReviewDue(problems, settings, input.syncDate),
    heatmap,
    recentSubmissions,
    recentNotes: problems.filter((problem) => problem.notes?.trim()).slice(0, 4),
  };
}

async function requestLeetCodeGraphql({ endpoint, fetcher, operationName, query, username, variables }) {
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://leetcode.cn',
      referer: `https://leetcode.cn/u/${username}/`,
      'user-agent': 'starry-summer-leetcode-sync/1.0',
    },
    body: JSON.stringify({ operationName, query, variables }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode.cn ${operationName} request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error(`LeetCode.cn ${operationName} returned errors: ${payload.errors.map((error) => error.message).join('; ')}`);
  }

  return payload.data ?? {};
}

function buildHeatmap(submissionCalendar) {
  if (!submissionCalendar) {
    return [];
  }

  const parsed = typeof submissionCalendar === 'string' ? JSON.parse(submissionCalendar) : submissionCalendar;

  return Object.entries(parsed)
    .map(([timestamp, count]) => ({
      date: timestampToDate(Number(timestamp)),
      count: Number(count) || 0,
    }))
    .filter((day) => day.date && day.count > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeRecentAcceptedSubmissions(submissions) {
  return submissions
    .map((submission) => {
      const question = submission.question ?? {};
      const titleSlug = String(question.titleSlug ?? '').trim();
      const submitTime = Number(submission.submitTime);

      if (!titleSlug || !Number.isFinite(submitTime)) {
        return null;
      }

      const submittedAt = new Date(submitTime * 1000).toISOString();

      return {
        title: String(question.translatedTitle || question.title || titleSlug).trim(),
        titleSlug,
        status: 'Accepted',
        language: 'LeetCode.cn',
        submittedAt,
        submittedAtLabel: submittedAt.slice(0, 10),
        problemUrl: `https://leetcode.cn/problems/${titleSlug}/`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

function buildRecentAcceptedRounds(submissions) {
  const roundsBySlug = new Map();

  for (const submission of [...submissions].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))) {
    const dates = roundsBySlug.get(submission.titleSlug) ?? [];
    const date = submission.submittedAtLabel;

    if (!dates.includes(date)) {
      roundsBySlug.set(submission.titleSlug, [...dates, date]);
    }
  }

  return roundsBySlug;
}

function mergeRounds(existingRounds = [], syncedRounds = [], roundCount) {
  return [...new Set([...(existingRounds ?? []), ...(syncedRounds ?? [])])]
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
    .slice(0, roundCount);
}

function buildCategories(problems, roundCount) {
  const groups = new Map();

  for (const problem of problems) {
    groups.set(problem.category, [...(groups.get(problem.category) ?? []), problem]);
  }

  return [...groups.entries()].map(([name, group]) => {
    const started = group.filter((problem) => problem.rounds.length > 0).length;
    const completed = group.filter((problem) => problem.rounds.length >= roundCount).length;

    return {
      name,
      total: group.length,
      started,
      completed,
      rate: group.length > 0 ? Math.round((started / group.length) * 1000) / 10 : 0,
    };
  });
}

function buildSummary({ calendar, lastActivityDate, problems, roundCount }) {
  const totalProblems = problems.length;
  const startedProblems = problems.filter((problem) => problem.rounds.length > 0).length;
  const completedProblems = problems.filter((problem) => problem.rounds.length >= roundCount).length;
  const doneRounds = problems.reduce((total, problem) => total + problem.rounds.length, 0);
  const totalRounds = totalProblems * roundCount;

  return {
    totalProblems,
    startedProblems,
    completedProblems,
    doneRounds,
    totalRounds,
    completionRate: totalRounds > 0 ? Math.round((doneRounds / totalRounds) * 1000) / 10 : 0,
    streak: Number.isFinite(Number(calendar?.recentStreak)) ? Number(calendar.recentStreak) : Number(calendar?.streak) || 0,
    totalDays: Number(calendar?.totalActiveDays) || 0,
    lastActivityDate,
  };
}

function buildReviewDue(problems, settings, syncDate) {
  const today = parseDate(syncDate);
  const intervals = settings.reviewIntervals ?? [];

  return problems
    .filter((problem) => problem.rounds.length > 0 && problem.rounds.length < settings.roundCount)
    .map((problem) => {
      const nextRoundIndex = problem.rounds.length;
      const lastRoundDate = parseDate(problem.rounds.at(-1));
      const interval = intervals[nextRoundIndex - 1] ?? 1;
      const dueDate = addDays(lastRoundDate, interval);
      const overdueDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000));

      return {
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        nextRound: `R${nextRoundIndex + 1}`,
        dueDate: formatDate(dueDate),
        overdueDays,
        forcedByMustRepeat: Boolean(problem.mustRepeat),
      };
    })
    .filter((task) => task.overdueDays > 0 || task.forcedByMustRepeat)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title))
    .slice(0, settings.dailyReview);
}

function timestampToDate(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return '';
  }

  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function parseDate(date) {
  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  return parsed;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86_400_000);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {
    dashboardPath: defaultDashboardPath,
    syncDate: new Date().toISOString().slice(0, 10),
    username: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dashboard') {
      args.dashboardPath = argv[index + 1] ?? args.dashboardPath;
      index += 1;
    } else if (arg === '--username') {
      args.username = argv[index + 1] ?? '';
      index += 1;
    } else if (arg === '--sync-date') {
      args.syncDate = argv[index + 1] ?? args.syncDate;
      index += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dashboard = JSON.parse(readFileSync(args.dashboardPath, 'utf8'));
  const username = (args.username || dashboard.settings?.leetcodeUsername || '').trim();

  if (!username) {
    throw new Error('LeetCode username is required. Pass --username <userSlug> or set settings.leetcodeUsername.');
  }

  const progress = await fetchLeetCodeCnProgress(username);
  const nextDashboard = mergeLeetCodeCnProgress(dashboard, {
    ...progress,
    username,
    syncDate: args.syncDate,
  });

  writeFileSync(args.dashboardPath, `${JSON.stringify(nextDashboard, null, 2)}\n`, 'utf8');
  console.log(
    `Synced ${username}: ${nextDashboard.summary.startedProblems}/${nextDashboard.summary.totalProblems} tracked problems, ${nextDashboard.recentSubmissions.length} recent submissions, ${nextDashboard.heatmap.length} active days.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
