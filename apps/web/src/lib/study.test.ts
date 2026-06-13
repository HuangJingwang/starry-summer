import { describe, expect, test, vi } from 'vitest';

import {
  buildAdminStudyRequest,
  buildPublicStudyRequest,
  buildStudyProblemDraftRequest,
  buildStudyReportDraftRequest,
  loadPublicStudyDashboard,
  normalizeStudyDashboard,
  readStudyErrorMessage,
} from './study';

describe('study dashboard client helpers', () => {
  test('normalizes missing study dashboard fields for public rendering', () => {
    expect(
      normalizeStudyDashboard({
        summary: {
          totalProblems: 3,
          startedProblems: 1,
          completedProblems: 0,
          doneRounds: 2,
          totalRounds: 15,
          completionRate: 13.333,
          streak: 2,
          totalDays: 4,
          lastActivityDate: '2026-06-12T08:00:00.000Z',
        },
        categories: [{ name: '动态规划', total: 2, started: 1, completed: 0, rate: 50 }],
      }),
    ).toMatchObject({
      summary: {
        completionRate: 13.3,
        lastActivityDate: '2026-06-12',
      },
      todayFocus: [],
      reviewDue: [],
      recentSubmissions: [],
      categories: [{ name: '动态规划', rate: 50 }],
    });
  });

  test('builds public and admin study API requests', () => {
    expect(buildPublicStudyRequest({ apiBaseUrl: 'https://api.example.com/' })).toEqual({
      url: 'https://api.example.com/study',
      init: {
        method: 'GET',
        next: {
          revalidate: 60,
        },
      },
    });
    expect(buildAdminStudyRequest().url).toBe('/api/admin/study');
    expect(buildStudyProblemDraftRequest('two-sum').url).toBe('/api/admin/study/problems/two-sum/draft');
    expect(buildStudyReportDraftRequest('week').init.body).toBe(JSON.stringify({ period: 'week' }));
  });

  test('loads the public study dashboard from API and falls back to a local model on failure', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        summary: {
          totalProblems: 1,
          startedProblems: 1,
          completedProblems: 0,
          doneRounds: 1,
          totalRounds: 5,
          completionRate: 20,
          streak: 1,
          totalDays: 1,
          lastActivityDate: '2026-06-12',
        },
      }),
    );

    await expect(loadPublicStudyDashboard({ apiBaseUrl: 'https://api.example.com', fetcher })).resolves.toMatchObject({
      source: 'api',
      dashboard: {
        summary: {
          totalProblems: 1,
          startedProblems: 1,
        },
      },
    });

    await expect(
      loadPublicStudyDashboard({
        apiBaseUrl: 'https://api.example.com',
        fetcher: vi.fn(async () => new Response(null, { status: 500 })),
      }),
    ).resolves.toMatchObject({
      source: 'fallback',
      dashboard: {
        summary: {
          totalProblems: expect.any(Number),
        },
      },
    });
  });

  test('keeps the fallback study dashboard useful for public rendering', async () => {
    const result = await loadPublicStudyDashboard({
      apiBaseUrl: 'https://api.example.com',
      fetcher: vi.fn(async () => new Response(null, { status: 503 })),
    });

    expect(result.source).toBe('fallback');
    expect(result.dashboard.categories.length).toBeGreaterThan(0);
    expect(result.dashboard.heatmap.length).toBeGreaterThan(0);
    expect(result.dashboard.recentNotes.length).toBeGreaterThan(0);
    expect(result.dashboard.todayFocus.length).toBeGreaterThan(0);
  });

  test('reads specific study API error messages for admin actions', async () => {
    await expect(
      readStudyErrorMessage(
        new Response(JSON.stringify({ message: ['LeetCode 用户名不能为空', '复习间隔格式不正确'] }), {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        }),
        '设置保存失败。',
      ),
    ).resolves.toBe('LeetCode 用户名不能为空；复习间隔格式不正确');

    await expect(readStudyErrorMessage(new Response('同步服务暂不可用', { status: 503 }), '同步失败。')).resolves.toBe('同步服务暂不可用');
    await expect(readStudyErrorMessage(new Response('', { status: 500 }), '同步失败。')).resolves.toBe('同步失败。');
  });
});
