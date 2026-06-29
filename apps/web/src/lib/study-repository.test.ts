import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

import { loadRepositoryStudyDashboard, readRepositoryStudyDashboard } from './study-repository';

describe('repository study dashboard', () => {
  test('loads LeetCode dashboard data from a repository-owned JSON file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'starry-study-'));
    const dashboardFilePath = join(directory, 'dashboard.json');

    writeFileSync(
      dashboardFilePath,
      JSON.stringify({
        summary: {
          totalProblems: 2,
          startedProblems: 1,
          completedProblems: 1,
          doneRounds: 2,
          totalRounds: 10,
          completionRate: 20,
          streak: 1,
          totalDays: 1,
          lastActivityDate: '2026-06-14T08:00:00.000Z',
        },
        recentSubmissions: [
          {
            title: 'Two Sum',
            titleSlug: 'two-sum',
            status: 'Accepted',
            language: 'TypeScript',
            submittedAt: '2026-06-14T08:20:00.000Z',
            submittedAtLabel: '2026-06-14',
            problemUrl: 'https://leetcode.cn/problems/two-sum/',
          },
        ],
      }),
      'utf8',
    );

    expect(readRepositoryStudyDashboard(dashboardFilePath)).toMatchObject({
      summary: {
        totalProblems: 2,
        lastActivityDate: '2026-06-14',
      },
      recentSubmissions: [
        {
          title: 'Two Sum',
          status: 'Accepted',
        },
      ],
    });

    await expect(loadRepositoryStudyDashboard({ dashboardFilePath })).resolves.toMatchObject({
      source: 'repository-file',
      dashboard: {
        summary: {
          totalProblems: 2,
        },
      },
    });
  });

  test('falls back when the repository dashboard file is unavailable', async () => {
    await expect(loadRepositoryStudyDashboard({ dashboardFilePath: 'missing-dashboard.json' })).resolves.toMatchObject({
      source: 'fallback',
      dashboard: {
        summary: {
          totalProblems: 0,
        },
      },
    });
  });
});
