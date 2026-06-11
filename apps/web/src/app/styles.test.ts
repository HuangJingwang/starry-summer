import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('global styles', () => {
  test('defines a system dark mode palette for public and admin surfaces', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/styles.css'), 'utf8');
    const darkModeBlock = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(darkModeBlock).toContain(':root');
    expect(darkModeBlock).toContain('--bg:');
    expect(darkModeBlock).toContain('--panel:');
    expect(darkModeBlock).toContain('--ink:');
    expect(darkModeBlock).toContain('--muted:');
    expect(darkModeBlock).toContain('--line:');
  });
});
