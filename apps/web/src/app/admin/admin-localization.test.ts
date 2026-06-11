import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

const files = [
  'src/components/AdminShell.tsx',
  'src/components/AdminSessionStatus.tsx',
  'src/components/AssetManager.tsx',
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
});
