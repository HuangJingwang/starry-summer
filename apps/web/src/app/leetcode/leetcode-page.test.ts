import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('leetcode archive page', () => {
  test('uses the repository dashboard for the public study archive', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/leetcode/page.tsx'), 'utf8');
    const siteShellSource = readFileSync(join(process.cwd(), 'src/components/SiteShell.tsx'), 'utf8');

    expect(source).toContain('loadRepositoryStudyDashboard');
    expect(siteShellSource).toContain('<StarrySkyCanvas className="site-shell__canvas" showFleet={false} />');
    expect(source).not.toContain('page-main__canvas');
    expect(source).toContain('page-title-row');
    expect(source).toContain('page-title');
    expect(source).toContain('study-snapshot-hero');
    expect(source).toContain('href="#review-rhythm"');
    expect(source).toContain('href="#today-plan"');
    expect(source).toContain('href="#activity"');
    expect(source).toContain('href="#categories"');
    expect(source).toContain('study-round-link');
    expect(source).toContain('buildCategoryAnchor');
    expect(source).toContain('content-section');
    expect(source).toContain('study-heatmap');
    expect(source).toContain('study-round-track');
    expect(source).toContain('study-note-grid');
    expect(source).toContain('recentNotes');
    expect(source).toContain('todayFocus');
    expect(source).toContain('reviewDue');
    expect(source).toContain('getLeetCodeProblemUrl');
    expect(source).not.toContain('study-hero');
    expect(source).not.toContain('study-progress-orb');
    expect(source).not.toContain('study-command-grid');
    expect(source).not.toContain('study-task-board');
    expect(source).not.toContain('ContentCard');
    expect(source).not.toContain('recentReviews');
    expect(source).not.toContain('recentStudyNotes');
    expect(source).not.toContain('最近复盘');
    expect(source).not.toContain('loadPublicStudyDashboard');
    expect(source).not.toContain('API_BASE_URL');
  });
});
