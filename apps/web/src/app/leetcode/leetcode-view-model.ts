import type { StudyDashboard, StudyHeatmapDay } from '@starry-summer/shared';

import { buildStudyHeatmapWindow } from '@/lib/study-heatmap';

export interface StudyRoundTrackItem {
  label: string;
  title: string;
  note: string;
  done: number;
  total: number;
  rate: number;
}

export interface LeetCodeArchiveViewModel {
  dashboard: StudyDashboard;
  roundTrack: StudyRoundTrackItem[];
  lastSyncLabel: string;
  categoryCount: number;
  heatmapDays: StudyHeatmapDay[];
}

export function buildLeetCodeArchiveViewModel(dashboard: StudyDashboard): LeetCodeArchiveViewModel {
  return {
    dashboard,
    roundTrack: buildRoundTrack(dashboard),
    lastSyncLabel: dashboard.settings.updatedAt || dashboard.summary.lastActivityDate || '等待同步',
    categoryCount: dashboard.categories.length,
    heatmapDays: buildStudyHeatmapWindow(
      dashboard.heatmap,
      dashboard.summary.lastActivityDate || dashboard.settings.updatedAt,
    ),
  };
}

export function buildRoundTrack(dashboard: StudyDashboard): StudyRoundTrackItem[] {
  const total = Math.max(1, dashboard.summary.totalProblems);
  const intervals = dashboard.settings.reviewIntervals;
  const problemRounds = dashboard.problems.length > 0
    ? Array.from({ length: dashboard.settings.roundCount }, (_, index) =>
        dashboard.problems.filter((problem) => Boolean(problem.rounds[index])).length,
      )
    : distributeDoneRounds(dashboard.summary.doneRounds, dashboard.settings.roundCount, total);

  return Array.from({ length: dashboard.settings.roundCount }, (_, index) => {
    const done = Math.min(total, problemRounds[index] ?? 0);
    const rate = Math.round((done / total) * 100);
    const interval = index === 0 ? '首次完成' : `+${intervals[index - 1] ?? '?'} 天`;

    return {
      label: `R${index + 1}`,
      title: index === 0 ? '新题建档' : '间隔复习',
      note: interval,
      done,
      total,
      rate,
    };
  });
}

export function buildCategoryAnchor(name: string) {
  return `category-${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorized'}`;
}

export function getLeetCodeProblemUrl(slug: string) {
  return `https://leetcode.cn/problems/${slug}/`;
}

export function normalizeDifficultyLabel(difficulty: string) {
  return ['简单', '中等', '困难'].includes(difficulty) ? difficulty : '未标注';
}

export function getDifficultyTone(difficulty: string): 'easy' | 'medium' | 'hard' {
  if (difficulty === '中等') {
    return 'medium';
  }

  if (difficulty === '困难') {
    return 'hard';
  }

  return 'easy';
}

function distributeDoneRounds(doneRounds: number, roundCount: number, totalProblems: number) {
  let remaining = doneRounds;

  return Array.from({ length: roundCount }, () => {
    const done = Math.max(0, Math.min(totalProblems, remaining));
    remaining -= done;

    return done;
  });
}
