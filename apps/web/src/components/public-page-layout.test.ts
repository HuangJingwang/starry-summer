import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('public page layout primitives', () => {
  test('keeps reusable public page header and content section components available', () => {
    const layoutSource = readSource('src/components/PublicPageLayout.tsx');
    const leetcodePageSource = readSource('src/app/leetcode/page.tsx');
    const todaySource = readSource('src/app/leetcode/StudyTodaySection.tsx');
    const activitySource = readSource('src/app/leetcode/StudyActivityPanel.tsx');

    expect(layoutSource).toContain('export function PublicPageHeader');
    expect(layoutSource).toContain('export function PublicContentSection');
    expect(layoutSource).toContain("'page-title-row'");
    expect(layoutSource).toContain("'content-section'");
    expect(layoutSource).toContain('section-heading');
    expect(leetcodePageSource).not.toContain('PublicPageHeader');
    expect(todaySource).toContain('PublicContentSection');
    expect(activitySource).toContain('PublicContentSection');
  });
});
