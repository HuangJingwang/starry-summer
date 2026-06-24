import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('projects page', () => {
  test('uses reference-inspired project showcase cards instead of generic content cards', () => {
    const pageSource = readSource('src/app/projects/page.tsx');
    const styles = readSource('src/app/styles/content.css');

    expect(pageSource).toContain('className="page-main projects-page"');
    expect(pageSource).not.toContain("import { ContentCard }");
    expect(pageSource).toContain('function ProjectShowcaseCard');
    expect(pageSource).toContain('className="projects-page__grid"');
    expect(pageSource).toContain('className="project-showcase-card__tags"');
    expect(pageSource).toContain('className="project-showcase-card__links"');

    expect(styles).toContain('.projects-page .project-showcase-card');
    expect(styles).toContain('grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);');
    expect(styles).toContain('.project-showcase-card__media');
    expect(styles).toContain(':root[data-theme=\'summer-day\'] .projects-page .project-showcase-card');
  });
});
