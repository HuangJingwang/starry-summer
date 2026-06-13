import { describe, expect, test, vi } from 'vitest';

import { InMemoryContentRepository } from '../content/content.repository';
import { ContentService } from '../content/content.service';
import { InMemoryStudyRepository } from './study.repository';
import { StudyService } from './study.service';

describe('StudyService', () => {
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
      }),
    ]);
    expect(dashboard.todayFocus.map((item) => item.slug)).not.toContain('two-sum');
    expect(dashboard.categories.some((category) => category.name === '哈希表')).toBe(true);
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
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await service.getDashboard()).recentSubmissions).toEqual([
      expect.objectContaining({
        titleSlug: 'two-sum',
        language: 'TypeScript',
      }),
    ]);
  });
});
