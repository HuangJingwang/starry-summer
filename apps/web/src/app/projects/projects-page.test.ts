import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('projects page', () => {
  test('uses a smaller cover ratio only for project list cards', () => {
    const pageSource = readSource('src/app/projects/page.tsx');
    const styles = readSource('src/app/styles/content.css');

    expect(pageSource).toContain('className="page-main projects-page"');
    expect(styles).toContain('.content-card__cover {\n  aspect-ratio: 16 / 9;');
    expect(styles).toContain('.projects-page .content-card__cover {\n  aspect-ratio: 21 / 9;');
  });
});
