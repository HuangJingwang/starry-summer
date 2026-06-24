import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('projects page', () => {
  test('uses the reference project grid and compact card structure', () => {
    const pageSource = readSource('src/app/projects/page.tsx');
    const detailSource = readSource('src/components/ContentDetail.tsx');
    const styles = readSource('src/app/styles/content.css');
    const responsiveStyles = readSource('src/app/styles/responsive.css');
    const thumbnailBlock = styles.match(/\.project-showcase-card__thumbnail\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const tagBlock = styles.match(/\.project-showcase-card__tags span\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const titleBlock = styles.match(/\.project-showcase-card__title-row h2\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const descriptionBlock = styles.match(/\.project-showcase-card__description\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';
    const linkBlock = styles.match(/\.project-showcase-card__links a\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? '';

    expect(pageSource).toContain('className="page-main projects-page"');
    expect(pageSource).not.toContain("import { ContentCard }");
    expect(pageSource).toContain('function ProjectShowcaseCard');
    expect(pageSource).toContain('className="projects-page__sr-title"');
    expect(pageSource).toContain('className="projects-page__grid"');
    expect(pageSource).toContain('className="project-showcase-card__header"');
    expect(pageSource).toContain('project-showcase-card__thumbnail');
    expect(pageSource).toContain('className="project-showcase-card__title-row"');
    expect(pageSource).toContain('className="project-showcase-card__tags"');
    expect(pageSource).toContain('className="project-showcase-card__links"');
    expect(pageSource).not.toContain('detailHref');
    expect(pageSource).not.toContain('links?.website?.trim() ||');
    expect(pageSource).toContain("{ label: 'Website', href: links?.website }");
    expect(detailSource).toContain("['GitHub', project.links?.repository]");

    expect(styles).toContain('.projects-page .project-showcase-card');
    expect(styles).toContain('.page-main.projects-page');
    expect(styles).toContain('max-width: 1200px;');
    expect(styles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(styles).toContain('flex-direction: column;');
    expect(styles).toContain('border-radius: 40px;');
    expect(styles).toContain('padding: 24px;');
    expect(styles).toContain('transform: scale(1.015);');
    expect(styles).toContain('.project-showcase-card__thumbnail');
    expect(styles).toContain('height: 64px;');
    expect(styles).toContain('width: 64px;');
    expect(thumbnailBlock).toContain('border-radius: 50%;');
    expect(thumbnailBlock).toContain('box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);');
    expect(titleBlock).toContain('font-size: 1.125rem;');
    expect(titleBlock).toContain('font-weight: 600;');
    expect(tagBlock).toContain('background: rgba(255, 255, 255, 0.06);');
    expect(tagBlock).toContain('border: 0;');
    expect(tagBlock).toContain('border-radius: 8px;');
    expect(tagBlock).toContain('color: rgba(226, 232, 240, 0.68);');
    expect(tagBlock).toContain('font-size: 0.75rem;');
    expect(tagBlock).toContain('font-weight: 400;');
    expect(tagBlock).toContain('padding: 4px 8px;');
    expect(descriptionBlock).toContain('font-size: 0.875rem;');
    expect(descriptionBlock).toContain('line-height: 1.625;');
    expect(linkBlock).toContain('font-size: 0.875rem;');
    expect(linkBlock).toContain('font-weight: 500;');
    expect(responsiveStyles).toContain('.projects-page__grid');
    expect(responsiveStyles).toContain('grid-template-columns: 1fr;');
    expect(responsiveStyles).not.toContain('.projects-page .project-showcase-card');
    expect(styles).toContain(':root[data-theme=\'summer-day\'] .projects-page .project-showcase-card');
  });
});
