import assert from 'node:assert/strict';

import { mergeLeetCodeCnProgress } from './sync-leetcode.mjs';

const baseDashboard = {
  settings: {
    leetcodeUsername: '',
    activeListId: 'hot100',
    roundCount: 5,
    reviewIntervals: [1, 3, 7, 14],
    dailyNew: 2,
    dailyReview: 3,
    deadline: '',
    updatedAt: '',
  },
  summary: {
    totalProblems: 2,
    startedProblems: 0,
    completedProblems: 0,
    doneRounds: 0,
    totalRounds: 10,
    completionRate: 0,
    streak: 0,
    totalDays: 0,
    lastActivityDate: '',
  },
  categories: [
    { name: '哈希表', total: 1, started: 0, completed: 0, rate: 0 },
    { name: '动态规划', total: 1, started: 0, completed: 0, rate: 0 },
  ],
  problems: [
    {
      number: 1,
      title: '两数之和',
      slug: 'two-sum',
      difficulty: '简单',
      category: '哈希表',
      listIds: ['hot100'],
      rounds: [],
      notes: '',
      solutionViewed: false,
      mustRepeat: false,
      timeSpentSeconds: [],
      updatedAt: '',
    },
    {
      number: 198,
      title: '打家劫舍',
      slug: 'house-robber',
      difficulty: '中等',
      category: '动态规划',
      listIds: ['hot100'],
      rounds: ['2026-04-20'],
      notes: '',
      solutionViewed: false,
      mustRepeat: false,
      timeSpentSeconds: [],
      updatedAt: '2026-04-20',
    },
  ],
  todayFocus: [],
  reviewDue: [],
  heatmap: [],
  recentSubmissions: [],
  recentNotes: [],
};

const synced = mergeLeetCodeCnProgress(baseDashboard, {
  username: 'adonis-14',
  syncDate: '2026-06-22',
  calendar: {
    recentStreak: 0,
    streak: 5,
    totalActiveDays: 2,
    submissionCalendar: JSON.stringify({
      1776729600: 3,
      1776816000: 2,
    }),
  },
  recentAcceptedSubmissions: [
    {
      submissionId: 1,
      submitTime: 1776828744,
      question: {
        translatedTitle: '打家劫舍',
        title: 'House Robber',
        titleSlug: 'house-robber',
      },
    },
    {
      submissionId: 2,
      submitTime: 1776820000,
      question: {
        translatedTitle: '未收录题目',
        title: 'External Problem',
        titleSlug: 'external-problem',
      },
    },
    {
      submissionId: 3,
      submitTime: 1776740000,
      question: {
        translatedTitle: '两数之和',
        title: 'Two Sum',
        titleSlug: 'two-sum',
      },
    },
  ],
});

assert.equal(synced.settings.leetcodeUsername, 'adonis-14');
assert.equal(synced.settings.updatedAt, '2026-06-22');
assert.deepEqual(synced.heatmap, [
  { date: '2026-04-21', count: 3 },
  { date: '2026-04-22', count: 2 },
]);
assert.equal(synced.summary.startedProblems, 2);
assert.equal(synced.summary.doneRounds, 3);
assert.equal(synced.summary.completionRate, 30);
assert.equal(synced.summary.streak, 0);
assert.equal(synced.summary.totalDays, 2);
assert.equal(synced.summary.lastActivityDate, '2026-04-22');
assert.deepEqual(synced.problems.find((problem) => problem.slug === 'house-robber')?.rounds, [
  '2026-04-20',
  '2026-04-22',
]);
assert.deepEqual(synced.problems.find((problem) => problem.slug === 'two-sum')?.rounds, ['2026-04-21']);
assert.equal(synced.recentSubmissions[0].problemUrl, 'https://leetcode.cn/problems/house-robber/');
assert.equal(synced.recentSubmissions[0].language, 'LeetCode.cn');
assert.equal(synced.reviewDue.length, 2);
assert.equal(synced.categories.find((category) => category.name === '动态规划')?.started, 1);

console.log('leetcode sync tests passed');
