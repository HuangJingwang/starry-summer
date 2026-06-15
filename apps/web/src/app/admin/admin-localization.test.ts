import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

const files = [
  'src/components/AdminShell.tsx',
  'src/components/AdminSessionStatus.tsx',
  'src/components/AssetManager.tsx',
  'src/components/TaxonomyManager.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/content/page.tsx',
  'src/app/admin/projects/page.tsx',
  'src/app/admin/assets/page.tsx',
  'src/app/admin/guestbook/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/taxonomy/page.tsx',
].map((file) => readFileSync(join(process.cwd(), file), 'utf8'));

describe('admin Chinese localization', () => {
  test('does not expose common English management labels in admin UI source', () => {
    const source = files.join('\n');

    expect(source).not.toMatch(/>Admin<|>View site<|>Logout<|>Login<|Checking session|Not signed in/);
    expect(source).not.toMatch(/>Upload<|>Uploading<|>Delete<|>Filter<|New content|New project/);
    expect(source).not.toMatch(/>Assets<|>Settings<|>Taxonomy<|>Guestbook<|>Projects<|>Content</);
    expect(source).not.toMatch(/Total \{|Published \{|Private \{|Archived \{|Pending comments|Guestbook review/);
  });

  test('keeps generated admin dashboard copy localized before rendering', () => {
    const source = readFileSync(join(process.cwd(), 'src/lib/admin-content-dashboard.ts'), 'utf8');

    expect(source).toContain("label: '全部'");
    expect(source).toContain('搜索：');
    expect(source).not.toMatch(/'All'|'Drafts'|'Published'|'Private'|'Archived'|'Never'/);
    expect(source).not.toMatch(/`Search:|`Type:|`Status:|`Category:|`Tag:|`Series:/);
  });
  test('marks the active admin navigation item for orientation', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/AdminShell.tsx'), 'utf8');

    expect(source).toContain('usePathname');
    expect(source).toContain('aria-current');
    expect(source).toContain('admin-command-bar');
  });
});
