import { describe, expect, test, vi } from 'vitest';

import { InMemoryContentRepository } from '../content/content.repository';
import { ContentService } from '../content/content.service';
import { InMemoryStudyRepository } from './study.repository';
import { StudyService } from './study.service';

describe('StudyService', () => {
  const legacyLeetCodeDomain = ['leetcode', 'com'].join('.');

  test('builds a dashboard with public-safe progress, focus tasks, and due reviews', async () => {
    const repository = new InMemoryStudyRepository(() => new Date('2026-06-12T08:00:00.000Z'));
    const service = new StudyService(repository, new ContentService(new InMemoryContentRepository()));

    await service.updateProblem('two-sum', {
      rounds: ['2026-06-01'],
      notes: '哈希表一遍扫描，注意下标不能复用。',
      mustRepeat: true,
    });
    await service.updateProblem('longest-substring-without-repeating-characters', {
      rounds: ['2026-06-11', '2026-06-12'],
    });

    const dashboard = await service.getDashboard();

    expect(dashboard.summary.totalProblems).toBeGreaterThan(0);
    expect(dashboard.summary.startedProblems).toBe(2);
    expect(dashboard.summary.streak).toBe(2);
    expect(dashboard.reviewDue).toEqual([
      expect.objectContaining({
        slug: 'two-sum',
        title: '两数之和',
        nextRound: 'R2',
        overdueDays: 10,
        forcedByMustRepeat: false,
      }),
    ]);
    expect(dashboard.todayFocus.map((item) => item.slug)).not.toContain('two-sum');
    expect(dashboard.categories.some((category) => category.name === '哈希表')).toBe(true);
  });

  test('keeps today focus stable inside the weakest category', async () => {
    const repository = new InMemoryStudyRepository(() => new Date('2026-06-12T08:00:00.000Z'));
    const service = new StudyService(repository, new ContentService(new InMemoryContentRepository()));

    await service.updateSettings({ dailyNew: 3 });
    await service.updateProblem('two-sum', { rounds: ['2026-06-10'] });
    await service.updateProblem('valid-parentheses', { rounds: ['2026-06-10'] });

    const first = await service.getDashboard();
    const second = await service.getDashboard();

    expect(first.todayFocus).toHaveLength(3);
    expect(new Set(first.todayFocus.map((item) => item.category)).size).toBe(1);
    expect(second.todayFocus.map((item) => item.slug)).toEqual(first.todayFocus.map((item) => item.slug));
  });

  test('includes must-repeat problems in review even before their due date', async () => {
    const repository = new InMemoryStudyRepository(() => new Date('2026-06-12T08:00:00.000Z'));
    const service = new StudyService(repository, new ContentService(new InMemoryContentRepository()));

    await service.updateProblem('two-sum', {
      rounds: ['2026-06-12'],
      mustRepeat: true,
    });

    expect((await service.getDashboard()).reviewDue).toEqual([
      expect.objectContaining({
        slug: 'two-sum',
        nextRound: 'R2',
        overdueDays: 0,
        forcedByMustRepeat: true,
      }),
    ]);
  });

  test('creates an editable note draft from a problem notebook entry', async () => {
    const contentRepository = new InMemoryContentRepository();
    const service = new StudyService(new InMemoryStudyRepository(), new ContentService(contentRepository));

    await service.updateProblem('two-sum', {
      rounds: ['2026-06-10', '2026-06-12'],
      notes: '用 Map 记录已访问数字，遇到 complement 直接返回。',
      solutionViewed: true,
    });

    const draft = await service.createProblemDraft('two-sum');

    expect(draft.type).toBe('note');
    expect(draft.status).toBe('draft');
    expect(draft.title).toBe('LeetCode 1. 两数之和复盘');
    expect(draft.slug).toBe('leetcode-two-sum-review');
    expect(draft.tags).toEqual(['LeetCode', '算法', '哈希表']);
    expect(draft.bodyMarkdown).toContain('## 题目');
    expect(draft.bodyMarkdown).toContain('用 Map 记录已访问数字');
    expect(draft.bodyMarkdown).toContain('https://leetcode.cn/problems/two-sum/');
    expect(draft.bodyMarkdown).not.toContain(`https://${legacyLeetCodeDomain}/problems/two-sum/`);
    expect(draft.bodyMarkdown).toContain('R2：2026-06-12');
  });

  test('creates a weekly study report draft from aggregate progress', async () => {
    const contentRepository = new InMemoryContentRepository();
    const service = new StudyService(
      new InMemoryStudyRepository(() => new Date('2026-06-12T08:00:00.000Z')),
      new ContentService(contentRepository),
    );

    await service.updateProblem('two-sum', { rounds: ['2026-06-10'] });
    await service.updateProblem('valid-parentheses', { rounds: ['2026-06-12'] });

    const draft = await service.createReportDraft('week');

    expect(draft.type).toBe('post');
    expect(draft.title).toBe('算法学习周报 2026-06-08');
    expect(draft.slug).toBe('leetcode-weekly-2026-06-08');
    expect(draft.bodyMarkdown).toContain('本周新刷/复习');
    expect(draft.bodyMarkdown).toContain('两数之和');
    expect(draft.categories).toEqual(['技术笔记']);
  });

  test('syncs recent public LeetCode submissions into submissions and problem progress', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        data: {
          recentSubmissionList: [
            {
              title: 'Two Sum',
              titleSlug: 'two-sum',
              timestamp: '1781126400',
              statusDisplay: 'Accepted',
              lang: 'TypeScript',
            },
          ],
        },
      }),
    );
    const service = new StudyService(
      new InMemoryStudyRepository(() => new Date('2026-06-12T08:00:00.000Z')),
      new ContentService(new InMemoryContentRepository()),
      fetcher,
    );

    await service.updateSettings({ leetcodeUsername: 'summer' });
    const result = await service.syncRecentSubmissions();

    expect(result.imported).toBe(1);
    expect(result.addedRounds).toBe(1);
    expect(result.historyBackfilled).toBe(0);
    expect(result.skipped).toBe(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      'https://leetcode.cn/graphql',
      expect.objectContaining({
        headers: expect.objectContaining({
          referer: 'https://leetcode.cn/',
        }),
      }),
    );
    expect((await service.getDashboard()).recentSubmissions).toEqual([
      expect.objectContaining({
        titleSlug: 'two-sum',
        language: 'TypeScript',
        problemUrl: 'https://leetcode.cn/problems/two-sum/',
      }),
    ]);
  });

  test('does not advance the same problem twice for duplicate same-day accepted submissions', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        data: {
          recentSubmissionList: [
            {
              title: 'Two Sum',
              titleSlug: 'two-sum',
              timestamp: '1781126400',
              statusDisplay: 'Accepted',
              lang: 'TypeScript',
            },
            {
              title: 'Two Sum',
              titleSlug: 'two-sum',
              timestamp: '1781155200',
              statusDisplay: 'Accepted',
              lang: 'TypeScript',
            },
          ],
        },
      }),
    );
    const service = new StudyService(
      new InMemoryStudyRepository(() => new Date('2026-06-12T08:00:00.000Z')),
      new ContentService(new InMemoryContentRepository()),
      fetcher,
    );

    await service.updateSettings({ leetcodeUsername: 'summer' });
    const result = await service.syncRecentSubmissions();

    expect(result.imported).toBe(2);
    expect(result.addedRounds).toBe(1);
    expect(result.skipped).toBe(1);
    expect((await service.getDashboard()).problems.find((problem) => problem.slug === 'two-sum')?.rounds).toEqual(['2026-06-10']);
  });

  test('backfills historical accepted submissions without overwriting existing rounds', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        data: {
          recentAcSubmissionList: [
            {
              title: 'Two Sum',
              titleSlug: 'two-sum',
              timestamp: '1780963200',
              statusDisplay: 'Accepted',
              lang: 'TypeScript',
            },
            {
              title: 'Valid Parentheses',
              titleSlug: 'valid-parentheses',
              timestamp: '1781049600',
              statusDisplay: 'Accepted',
              lang: 'TypeScript',
            },
          ],
          recentSubmissionList: [],
        },
      }),
    );
    const service = new StudyService(
      new InMemoryStudyRepository(() => new Date('2026-06-12T08:00:00.000Z')),
      new ContentService(new InMemoryContentRepository()),
      fetcher,
    );

    await service.updateSettings({ leetcodeUsername: 'summer' });
    await service.updateProblem('two-sum', { rounds: ['2026-06-01'] });

    const result = await service.syncRecentSubmissions();

    expect(result.historyBackfilled).toBe(1);
    expect(result.addedRounds).toBe(0);
    expect((await service.getDashboard()).problems.find((problem) => problem.slug === 'two-sum')?.rounds).toEqual(['2026-06-01']);
    expect((await service.getDashboard()).problems.find((problem) => problem.slug === 'valid-parentheses')?.rounds).toEqual(['2026-06-11']);
  });
});
