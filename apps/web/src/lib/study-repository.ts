import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { StudyDashboard } from '@starry-summer/shared';

import { normalizeStudyDashboard, type StudyLoadResult } from './study';

const defaultRepositoryStudyPath = join(process.cwd(), 'content', 'leetcode', 'dashboard.json');

export interface RepositoryStudyLoadOptions {
  dashboardFilePath?: string;
}

export async function loadRepositoryStudyDashboard(options: RepositoryStudyLoadOptions = {}): Promise<StudyLoadResult> {
  try {
    return {
      source: 'repository-file',
      dashboard: readRepositoryStudyDashboard(options.dashboardFilePath ?? defaultRepositoryStudyPath),
    };
  } catch {
    return {
      source: 'fallback',
      dashboard: normalizeStudyDashboard({}),
    };
  }
}

export function readRepositoryStudyDashboard(dashboardFilePath = defaultRepositoryStudyPath): StudyDashboard {
  return normalizeStudyDashboard(JSON.parse(readFileSync(dashboardFilePath, 'utf8')) as Partial<StudyDashboard>);
}
