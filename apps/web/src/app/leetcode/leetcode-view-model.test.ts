import type { StudyDashboard } from '@starry-summer/shared';
import { describe, expect, test } from 'vitest';

import {
  buildCategoryAnchor,
  buildLeetCodeArchiveViewModel,
  getDifficultyTone,
  getLeetCodeProblemUrl,
  normalizeDifficultyLabel,
} from './leetcode-view-model';

const dashboard: StudyDashboard = {
  settings: {
    leetcodeUsername: 'aster',
    activeListId: 'hot100',
    roundCount: 3,
    reviewIntervals: [1, 3],
    dailyNew: 2,
    dailyReview: 4,
    deadline: '',
    updatedAt: '2026-06-21',
  },
  summary: {
    totalProblems: 4,
    startedProblems: 3,
    completedProblems: 1,
    doneRounds: 5,
    totalRounds: 12,
    completionRate: 42,
    streak: 6,
    totalDays: 18,
    lastActivityDate: '2026-06-22',
  },
  categories: [
    { name: '双指针 / Sliding Window', total: 2, started: 1, completed: 0, rate: 50 },
    { name: '动态规划', total: 2, started: 2, completed: 1, rate: 75 },
  ],
  problems: [
    {
      number: 1,
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: '简单',
      category: '哈希表',
      listIds: ['hot100'],
      rounds: ['2026-06-01', '2026-06-02', '2026-06-05'],
      notes: '边界条件',
      solutionViewed: false,
      mustRepeat: false,
      timeSpentSeconds: [600],
      updatedAt: '2026-06-05',
    },
    {
      number: 2,
      title: 'Add Two Numbers',
      slug: 'add-two-numbers',
      difficulty: '中等',
      category: '链表',
      listIds: ['hot100'],
      rounds: ['2026-06-01'],
      notes: '',
      solutionViewed: false,
      mustRepeat: true,
      timeSpentSeconds: [1200],
      updatedAt: '2026-06-01',
    },
  ],
  todayFocus: [],
  reviewDue: [],
  heatmap: [
    { date: '2026-06-21', count: 2 },
    { date: '2026-06-22', count: 4 },
  ],
  recentSubmissions: [],
  recentNotes: [],
};

describe('leetcode archive view model', () => {
  test('summarizes the public dashboard without leaking render details into the page', () => {
    const viewModel = buildLeetCodeArchiveViewModel(dashboard);

    expect(viewModel.lastSyncLabel).toBe('2026-06-21');
    expect(viewModel.categoryCount).toBe(2);
    expect(viewModel.roundTrack).toEqual([
      { label: 'R1', title: '新题建档', note: '首次完成', done: 2, total: 4, rate: 50 },
      { label: 'R2', title: '间隔复习', note: '+1 天', done: 1, total: 4, rate: 25 },
      { label: 'R3', title: '间隔复习', note: '+3 天', done: 1, total: 4, rate: 25 },
    ]);
    expect(viewModel.heatmapDays).toHaveLength(365);
    expect(viewModel.heatmapDays.at(-1)).toEqual({ date: '2026-06-22', count: 4 });
  });

  test('keeps public link labels stable and compact', () => {
    expect(buildCategoryAnchor('双指针 / Sliding Window')).toBe('category-双指针-sliding-window');
    expect(buildCategoryAnchor('  !!!  ')).toBe('category-uncategorized');
    expect(getLeetCodeProblemUrl('two-sum')).toBe('https://leetcode.cn/problems/two-sum/');
    expect(normalizeDifficultyLabel('中等')).toBe('中等');
    expect(normalizeDifficultyLabel('unknown')).toBe('未标注');
    expect(getDifficultyTone('困难')).toBe('hard');
    expect(getDifficultyTone('中等')).toBe('medium');
    expect(getDifficultyTone('简单')).toBe('easy');
  });
});
