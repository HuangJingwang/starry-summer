import { describe, expect, test } from 'vitest';

import {
  DEFAULT_STUDY_PROBLEMS,
  STUDY_PROBLEM_LIST_COUNTS,
  STUDY_LIST_LABELS,
  type StudyProblemListId,
} from './study';

describe('study problem catalog', () => {
  test('ships complete first-phase LeetCode lists without duplicate problem rows', () => {
    for (const listId of Object.keys(STUDY_LIST_LABELS) as StudyProblemListId[]) {
      expect(DEFAULT_STUDY_PROBLEMS.filter((problem) => problem.listIds.includes(listId))).toHaveLength(STUDY_PROBLEM_LIST_COUNTS[listId]);
    }

    expect(new Set(DEFAULT_STUDY_PROBLEMS.map((problem) => problem.slug)).size).toBe(DEFAULT_STUDY_PROBLEMS.length);
  });

  test('keeps shared problems attached to every matching list', () => {
    expect(DEFAULT_STUDY_PROBLEMS.find((problem) => problem.slug === 'two-sum')?.listIds).toEqual(
      expect.arrayContaining(['hot100', 'top150']),
    );
    expect(DEFAULT_STUDY_PROBLEMS.find((problem) => problem.slug === 'reverse-linked-list')?.listIds).toEqual(
      expect.arrayContaining(['hot100', 'top150']),
    );
    expect(DEFAULT_STUDY_PROBLEMS.find((problem) => problem.slug === 'shu-zu-zhong-zhong-fu-de-shu-zi-lcof')?.listIds).toEqual(['offer75']);
  });
});
