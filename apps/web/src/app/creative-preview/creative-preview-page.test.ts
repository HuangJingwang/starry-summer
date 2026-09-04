import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('creative preview page', () => {
  test('keeps the 3D-inspired landing composition isolated from the public home', () => {
    const pagePath = 'src/app/creative-preview/page.tsx';
    const previewPath = 'src/app/creative-preview/CreativePortfolioPreview.tsx';
    const stylePath = 'src/app/creative-preview/creative-preview.module.css';

    expect(existsSync(join(process.cwd(), pagePath))).toBe(true);
    expect(existsSync(join(process.cwd(), previewPath))).toBe(true);
    expect(existsSync(join(process.cwd(), stylePath))).toBe(true);

    const pageSource = readSource(pagePath);
    const previewSource = readSource(previewPath);
    const styleSource = readSource(stylePath);

    expect(pageSource).toContain('<CreativePortfolioPreview />');
    expect(previewSource).toContain("from 'framer-motion'");
    expect(previewSource).toContain('function Magnet');
    expect(previewSource).toContain('function ScrollMarquee');
    expect(previewSource).toContain('function AnimatedText');
    expect(previewSource).toContain('Aster.H');
    expect(previewSource).toContain('>\n          Projects\n        </h2>');
    expect(previewSource).toContain('Nextlevel Studio');
    expect(styleSource).toContain('.preview');
    expect(styleSource).toContain('position: sticky;');
    expect(styleSource).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
