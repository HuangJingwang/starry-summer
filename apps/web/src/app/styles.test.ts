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

  test('keeps admin form fields on the theme panel background', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/styles.css'), 'utf8');
    const adminFieldBlock = css.match(/\.admin-filter input,[\s\S]*?\.split-panels textarea\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(adminFieldBlock).toContain('background: var(--panel);');
    expect(adminFieldBlock).not.toContain('background: #fff;');
  });

  test('defines the cyber archive visual system used by the home page', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/styles.css'), 'utf8');

    expect(css).toContain('--cyber-bg: #04060e;');
    expect(css).toContain('.cyber-home');
    expect(css).toContain('.cyber-firefly');
    expect(css).toContain('@keyframes cyber-firefly-drift');
    expect(css).toContain('.author-bio-card');
    expect(css).toContain('.content-filter-rail');
    expect(css).toContain('.cyber-home .content-card');
  });
});
