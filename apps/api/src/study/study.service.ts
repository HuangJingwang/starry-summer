import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import {
  DEFAULT_STUDY_PROBLEMS,
  DEFAULT_STUDY_SETTINGS,
  type StudyDashboard,
  type StudyHeatmapDay,
  type StudyProblem,
  type StudyProblemPatch,
  type StudyReportPeriod,
  type StudyReviewTask,
  type StudySettings,
  type StudySettingsPatch,
  type StudySubmission,
  type StudyTask,
} from '@starry-summer/shared';

import { ContentService } from '../content/content.service.js';
import type { ContentRecord } from '../content/content.types.js';
import { STUDY_REPOSITORY, type StudyRepository } from './study.repository.js';

interface LeetCodeSubmissionPayload {
  title?: string;
  titleSlug?: string;
  timestamp?: string | number;
  statusDisplay?: string;
  lang?: string;
}

interface LeetCodeRecentSubmissionsResponse {
  data?: {
    recentSubmissionList?: LeetCodeSubmissionPayload[];
    recentAcSubmissionList?: LeetCodeSubmissionPayload[];
  };
}

export interface StudySyncResult {
  imported: number;
  matchedProblems: number;
  addedRounds: number;
  historyBackfilled: number;
  skipped: number;
  error?: string;
}

const LEETCODE_GRAPHQL_URL = 'https://leetcode.cn/graphql';

@Injectable()
export class StudyService {
  constructor(
    @Inject(STUDY_REPOSITORY)
    private readonly repository: StudyRepository,
    @Inject(ContentService)
    private readonly contentService: ContentService,
    @Optional()
    private readonly fetcher: (url: string, init: RequestInit) => Promise<Response> = (url, init) => fetch(url, init),
  ) {}

  async getDashboard(): Promise<StudyDashboard> {
    await this.ensureDefaultProblems();
    const settings = await this.repository.getSettings();
    const allProblems = await this.repository.listProblems();
    const problems = allProblems.filter((problem) => problem.listIds.includes(settings.activeListId));
    const recentSubmissions = await this.repository.listSubmissions(12);
    const today = this.today();
    const reviewDue = buildReviewDue(problems, settings, today).slice(0, settings.dailyReview || 5);
    const reviewSlugs = new Set(reviewDue.map((item) => item.slug));
    const todayFocus = buildTodayFocus(problems, settings, reviewSlugs);

    return {
      settings,
      summary: buildSummary(problems, settings, today),
      categories: buildCategoryProgress(problems, settings),
      problems,
      todayFocus,
      reviewDue,
      heatmap: buildHeatmap(problems, today),
      recentSubmissions,
      recentNotes: problems.filter((problem) => problem.notes.trim()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    };
  }

  async updateSettings(patch: StudySettingsPatch): Promise<StudySettings> {
    return this.repository.updateSettings(patch);
  }

  async updateProblem(slug: string, patch: StudyProblemPatch): Promise<StudyProblem> {
    await this.ensureDefaultProblems();
    const updated = await this.repository.updateProblem(slug, patch);

    if (!updated) {
      throw new NotFoundException(`Study problem ${slug} was not found`);
    }

    return updated;
  }

  async syncRecentSubmissions(): Promise<StudySyncResult> {
    await this.ensureDefaultProblems();
    const settings = await this.repository.getSettings();
    const username = settings.leetcodeUsername.trim();

    if (!username) {
      return { imported: 0, matchedProblems: 0, addedRounds: 0, historyBackfilled: 0, skipped: 0 };
    }

    const response = await this.fetcher(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        referer: 'https://leetcode.cn/',
      },
      body: JSON.stringify({
        query: `
          query studySubmissions($username: String!, $recentLimit: Int!, $historyLimit: Int!) {
            recentSubmissionList(username: $username, limit: $recentLimit) {
              title
              titleSlug
              timestamp
              statusDisplay
              lang
            }
            recentAcSubmissionList(username: $username, limit: $historyLimit) {
              title
              titleSlug
              timestamp
              statusDisplay
              lang
            }
          }
        `,
        variables: {
          username,
          recentLimit: 50,
          historyLimit: 300,
        },
      }),
    });

    if (!response.ok) {
      return { imported: 0, matchedProblems: 0, addedRounds: 0, historyBackfilled: 0, skipped: 0, error: `LeetCode responded ${response.status}` };
    }

    const payload = (await response.json()) as LeetCodeRecentSubmissionsResponse;
    const syncState = await this.repository.getSyncState();
    const shouldBackfill = (
      syncState.historyBackfilledUsername !== username
      || syncState.historyBackfilledListId !== settings.activeListId
    );
    let historyBackfilled = 0;

    if (shouldBackfill) {
      const historicalAccepted = (payload.data?.recentAcSubmissionList ?? [])
        .map((submission) => normalizeSubmission({ ...submission, statusDisplay: submission.statusDisplay ?? 'Accepted' }))
        .filter((submission): submission is StudySubmission => submission !== null && submission.status === 'Accepted');
      historyBackfilled = await this.backfillAcceptedHistory(historicalAccepted, settings.activeListId);
      await this.repository.updateSyncState({
        historyBackfilledAt: new Date().toISOString(),
        historyBackfilledUsername: username,
        historyBackfilledListId: settings.activeListId,
      });
    }

    const submissions = (payload.data?.recentSubmissionList ?? [])
      .map(normalizeSubmission)
      .filter((submission): submission is StudySubmission => submission !== null);
    const imported = await this.repository.upsertSubmissions(submissions);
    let addedRounds = 0;
    let skipped = 0;

    for (const submission of submissions) {
      if (syncState.lastSyncedAt && submission.submittedAt <= syncState.lastSyncedAt) {
        skipped += 1;
        continue;
      }

      if (submission.status !== 'Accepted') {
        skipped += 1;
        continue;
      }

      const problem = await this.repository.findProblem(submission.titleSlug);

      if (!problem || !problem.listIds.includes(settings.activeListId) || problem.rounds.includes(submission.submittedAtLabel) || problem.rounds.length >= settings.roundCount) {
        skipped += 1;
        continue;
      }

      addedRounds += 1;
      await this.repository.updateProblem(problem.slug, {
        rounds: [...problem.rounds, submission.submittedAtLabel],
      });
    }

    await this.repository.updateSyncState({ lastSyncedAt: new Date().toISOString() });

    return { imported, matchedProblems: addedRounds + historyBackfilled, addedRounds, historyBackfilled, skipped };
  }

  async createProblemDraft(slug: string): Promise<ContentRecord> {
    await this.ensureDefaultProblems();
    const problem = await this.repository.findProblem(slug);

    if (!problem) {
      throw new NotFoundException(`Study problem ${slug} was not found`);
    }

    return this.contentService.createDraft({
      type: 'note',
      title: `LeetCode ${problem.number}. ${problem.title}复盘`,
      slug: `leetcode-${problem.slug}-review`,
      summary: `${problem.title} 的个人题解、复杂度和复盘记录。`,
      bodyMarkdown: buildProblemDraftMarkdown(problem),
      categories: ['技术笔记'],
      tags: ['LeetCode', '算法', problem.category],
    });
  }

  async createReportDraft(period: StudyReportPeriod): Promise<ContentRecord> {
    const dashboard = await this.getDashboard();
    const anchor = period === 'week' ? startOfWeek(this.today()) : startOfMonth(this.today());
    const dateLabel = toDateLabel(anchor);
    const title = period === 'week' ? `算法学习周报 ${dateLabel}` : `算法学习月报 ${dateLabel}`;
    const slug = period === 'week' ? `leetcode-weekly-${dateLabel}` : `leetcode-monthly-${dateLabel}`;

    return this.contentService.createDraft({
      type: 'post',
      title,
      slug,
      summary: `记录 ${dateLabel} 开始的算法学习进度、复习情况和下阶段计划。`,
      bodyMarkdown: buildReportMarkdown(dashboard, period, dateLabel),
      categories: ['技术笔记'],
      tags: ['LeetCode', '算法', period === 'week' ? '周报' : '月报'],
    });
  }

  private async ensureDefaultProblems(): Promise<void> {
    const existing = new Set((await this.repository.listProblems()).map((problem) => problem.slug));

    for (const problem of DEFAULT_STUDY_PROBLEMS) {
      if (!existing.has(problem.slug)) {
        await this.repository.upsertProblem({
          ...problem,
          updatedAt: this.today().toISOString(),
        });
      }
    }
  }

  private async backfillAcceptedHistory(submissions: StudySubmission[], activeListId: StudySettings['activeListId']): Promise<number> {
    let imported = 0;

    for (const submission of submissions) {
      const problem = await this.repository.findProblem(submission.titleSlug);

      if (!problem || !problem.listIds.includes(activeListId) || problem.rounds.length > 0) {
        continue;
      }

      imported += 1;
      await this.repository.updateProblem(problem.slug, {
        rounds: [submission.submittedAtLabel],
      });
    }

    return imported;
  }

  private today(): Date {
    const now = (this.repository as { now?: () => Date }).now?.() ?? new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
}

function buildSummary(problems: StudyProblem[], settings: StudySettings, today: Date): StudyDashboard['summary'] {
  const doneRounds = problems.reduce((total, problem) => total + problem.rounds.length, 0);
  const totalRounds = problems.length * settings.roundCount;
  const activityDates = uniqueSortedDates(problems.flatMap((problem) => problem.rounds));

  return {
    totalProblems: problems.length,
    startedProblems: problems.filter((problem) => problem.rounds.length > 0).length,
    completedProblems: problems.filter((problem) => problem.rounds.length >= settings.roundCount).length,
    doneRounds,
    totalRounds,
    completionRate: totalRounds > 0 ? Math.round((doneRounds / totalRounds) * 1000) / 10 : 0,
    streak: computeStreak(activityDates, today),
    totalDays: activityDates.length,
    lastActivityDate: activityDates.at(-1) ?? '',
  };
}

function buildCategoryProgress(problems: StudyProblem[], settings: StudySettings): StudyDashboard['categories'] {
  const grouped = new Map<string, StudyProblem[]>();

  for (const problem of problems) {
    grouped.set(problem.category, [...(grouped.get(problem.category) ?? []), problem]);
  }

  return [...grouped.entries()]
    .map(([name, items]) => ({
      name,
      total: items.length,
      started: items.filter((item) => item.rounds.length > 0).length,
      completed: items.filter((item) => item.rounds.length >= settings.roundCount).length,
      rate: items.length > 0 ? Math.round((items.reduce((total, item) => total + item.rounds.length, 0) / (items.length * settings.roundCount)) * 100) : 0,
    }))
    .sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name, 'zh-CN'));
}

function buildReviewDue(problems: StudyProblem[], settings: StudySettings, today: Date): StudyReviewTask[] {
  return problems
    .flatMap((problem) => {
      if (problem.rounds.length === 0 || problem.rounds.length >= settings.roundCount) {
        return [];
      }

      const lastRoundDate = parseDate(problem.rounds.at(-1));
      const interval = settings.reviewIntervals[problem.rounds.length - 1] ?? DEFAULT_STUDY_SETTINGS.reviewIntervals.at(-1) ?? 14;

      if (!lastRoundDate) {
        return [];
      }

      const dueDate = addDays(lastRoundDate, interval);

      if (today < dueDate && !problem.mustRepeat) {
        return [];
      }

      return [{
        ...toStudyTask(problem),
        nextRound: `R${problem.rounds.length + 1}`,
        dueDate: toDateLabel(dueDate),
        overdueDays: Math.max(0, daysBetween(dueDate, today)),
        forcedByMustRepeat: today < dueDate && problem.mustRepeat,
      }];
    })
    .sort((a, b) => b.overdueDays - a.overdueDays || a.title.localeCompare(b.title, 'zh-CN'));
}

function buildTodayFocus(problems: StudyProblem[], settings: StudySettings, reviewSlugs: Set<string>): StudyTask[] {
  const todos = problems.filter((problem) => problem.rounds.length === 0 && !reviewSlugs.has(problem.slug));
  const desiredCount = settings.dailyNew || 3;

  if (todos.length <= desiredCount) {
    return todos.map(toStudyTask);
  }

  const categoryProgress = buildCategoryProgress(problems, settings);
  const categoryRate = new Map(categoryProgress.map((category) => [category.name, category.rate]));
  const preferredCategory = [...new Set(todos.map((problem) => problem.category))]
    .sort((a, b) => (categoryRate.get(a) ?? 0) - (categoryRate.get(b) ?? 0) || a.localeCompare(b, 'zh-CN'))[0];
  const difficultyOrder: Record<StudyProblem['difficulty'], number> = {
    简单: 0,
    中等: 1,
    困难: 2,
  };
  const selected = todos
    .filter((problem) => problem.category === preferredCategory)
    .sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty] || a.number - b.number)
    .slice(0, desiredCount);

  if (selected.length < desiredCount) {
    const selectedSlugs = new Set(selected.map((problem) => problem.slug));
    selected.push(...todos.filter((problem) => !selectedSlugs.has(problem.slug)).slice(0, desiredCount - selected.length));
  }

  return selected.map(toStudyTask);
}

function buildHeatmap(problems: StudyProblem[], today: Date): StudyHeatmapDay[] {
  const counts = new Map<string, number>();

  for (const date of problems.flatMap((problem) => problem.rounds)) {
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return Array.from({ length: 84 }, (_, index) => {
    const date = addDays(today, index - 83);
    const label = toDateLabel(date);

    return {
      date: label,
      count: counts.get(label) ?? 0,
    };
  });
}

function buildProblemDraftMarkdown(problem: StudyProblem): string {
  const rounds = problem.rounds.map((date, index) => `- R${index + 1}：${date}`).join('\n') || '- 暂无复习记录';

  return [
    '## 题目',
    '',
    `- 题号：${problem.number}`,
    `- 标题：${problem.title}`,
    `- 难度：${problem.difficulty}`,
    `- 分类：${problem.category}`,
    `- 链接：https://leetcode.cn/problems/${problem.slug}/`,
    '',
    '## 思路',
    '',
    problem.notes || '记录核心思路、状态定义或关键数据结构。',
    '',
    '## 复杂度',
    '',
    '- 时间复杂度：',
    '- 空间复杂度：',
    '',
    '## 易错点',
    '',
    problem.solutionViewed ? '- 已看过题解，需要确认是否真正独立复现。' : '- 暂未标记看过题解。',
    problem.mustRepeat ? '- 已标记为重点复刷。' : '- 暂未标记重点复刷。',
    '',
    '## 复习记录',
    '',
    rounds,
    '',
    '## 复盘',
    '',
    '这道题下次重做时，重点观察自己是否能快速还原关键思路。',
  ].join('\n');
}

function buildReportMarkdown(dashboard: StudyDashboard, period: StudyReportPeriod, dateLabel: string): string {
  const recent = dashboard.problems
    .filter((problem) => problem.rounds.some((round) => round >= dateLabel))
    .slice(0, 8);

  return [
    `## ${period === 'week' ? '本周' : '本月'}概览`,
    '',
    `- 本周新刷/复习：${recent.length} 次记录`,
    `- 已开始题目：${dashboard.summary.startedProblems} / ${dashboard.summary.totalProblems}`,
    `- 总复习轮次：${dashboard.summary.doneRounds} / ${dashboard.summary.totalRounds}`,
    `- 连续打卡：${dashboard.summary.streak} 天`,
    '',
    '## 代表题目',
    '',
    ...(recent.length > 0 ? recent.map((problem) => `- ${problem.title}（${problem.category} / ${problem.difficulty}）`) : ['- 暂无记录']),
    '',
    '## 分类观察',
    '',
    ...dashboard.categories.slice(0, 5).map((category) => `- ${category.name}：${category.started}/${category.total} 已开始，进度 ${category.rate}%`),
    '',
    '## 下阶段计划',
    '',
    '- 继续优先处理到期复习。',
    '- 对重点复刷题补齐个人题解。',
  ].join('\n');
}

function normalizeSubmission(input: LeetCodeSubmissionPayload): StudySubmission | null {
  const title = input.title?.trim();
  const titleSlug = input.titleSlug?.trim();
  const timestamp = Number(input.timestamp);

  if (!title || !titleSlug || !Number.isFinite(timestamp)) {
    return null;
  }

  const submittedAt = new Date(timestamp * 1000).toISOString();

  return {
    title,
    titleSlug,
    status: input.statusDisplay?.trim() || 'Submitted',
    language: input.lang?.trim() || 'Unknown',
    submittedAt,
    submittedAtLabel: submittedAt.slice(0, 10),
    problemUrl: `https://leetcode.cn/problems/${titleSlug}/`,
  };
}

function toStudyTask(problem: StudyProblem): StudyTask {
  return {
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    category: problem.category,
  };
}

function computeStreak(dates: string[], today: Date): number {
  const set = new Set(dates);
  let cursor = today;
  let streak = 0;

  while (set.has(toDateLabel(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function uniqueSortedDates(dates: string[]): string[] {
  return [...new Set(dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))].sort();
}

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  const day = next.getUTCDay() || 7;
  next.setUTCDate(next.getUTCDate() - day + 1);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function toDateLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}
