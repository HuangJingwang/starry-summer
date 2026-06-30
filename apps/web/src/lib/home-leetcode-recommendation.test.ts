import { describe, expect, test } from 'vitest';
import { DEFAULT_STUDY_SETTINGS, type StudyDashboard, type StudyProblem } from '@starry-summer/shared';

import { buildHomeLeetCodeRecommendation } from './home-leetcode-recommendation';
import { normalizeStudyDashboard } from './study';

const baseProblem: StudyProblem = {
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
};

function buildDashboard(input: Partial<StudyDashboard>) {
  return normalizeStudyDashboard(input);
}

describe('home LeetCode recommendation', () => {
  test('recommends the first unstarted focus problem for the home card', () => {
    const recommendation = buildHomeLeetCodeRecommendation(
      buildDashboard({
        todayFocus: [
          {
            slug: 'longest-substring-without-repeating-characters',
            title: '无重复字符的最长子串',
            difficulty: '中等',
            category: '滑动窗口',
          },
        ],
        reviewDue: [
          {
            slug: '3sum',
            title: '三数之和',
            difficulty: '中等',
            category: '双指针',
            nextRound: 'R2',
            dueDate: '2026-06-30',
            overdueDays: 0,
            forcedByMustRepeat: false,
          },
        ],
      }),
    );

    expect(recommendation).toMatchObject({
      kind: 'new',
      label: '未刷新题',
      title: '无重复字符的最长子串',
      href: 'https://leetcode.cn/problems/longest-substring-without-repeating-characters/',
    });
    expect(recommendation?.description).toContain('还没有刷过');
    expect(recommendation?.description).toContain('滑动窗口');
  });

  test('falls back to due review tasks when there are no new focus problems', () => {
    const recommendation = buildHomeLeetCodeRecommendation(
      buildDashboard({
        todayFocus: [],
        reviewDue: [
          {
            slug: 'binary-tree-level-order-traversal',
            title: '二叉树的层序遍历',
            difficulty: '中等',
            category: '二叉树',
            nextRound: 'R3',
            dueDate: '2026-06-30',
            overdueDays: 2,
            forcedByMustRepeat: false,
          },
        ],
      }),
    );

    expect(recommendation).toMatchObject({
      kind: 'review',
      label: '到期复习',
      title: '二叉树的层序遍历',
    });
    expect(recommendation?.description).toContain('R3');
    expect(recommendation?.description).toContain('逾期 2 天');
  });

  test('uses an unstarted active-list problem when today queues are empty', () => {
    const recommendation = buildHomeLeetCodeRecommendation(
      buildDashboard({
        settings: {
          ...DEFAULT_STUDY_SETTINGS,
          activeListId: 'hot100',
        },
        problems: [
          { ...baseProblem, slug: 'started', title: '已经开始', rounds: ['2026-06-28'] },
          { ...baseProblem, slug: 'group-anagrams', title: '字母异位词分组', category: '哈希表' },
        ],
      }),
    );

    expect(recommendation).toMatchObject({
      kind: 'new',
      label: '未刷新题',
      title: '字母异位词分组',
    });
  });
});
