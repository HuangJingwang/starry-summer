import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('creative preview page', () => {
  test('uses repository content as a personal blog home preview instead of a design portfolio', () => {
    const pagePath = 'src/app/creative-preview/page.tsx';
    const previewPath = 'src/app/creative-preview/CreativePortfolioPreview.tsx';
    const stylePath = 'src/app/creative-preview/creative-preview.module.css';

    expect(existsSync(join(process.cwd(), pagePath))).toBe(true);
    expect(existsSync(join(process.cwd(), previewPath))).toBe(true);
    expect(existsSync(join(process.cwd(), stylePath))).toBe(true);

    const pageSource = readSource(pagePath);
    const previewSource = readSource(previewPath);
    const styleSource = readSource(stylePath);

    expect(pageSource).toContain("import { loadSiteContent } from '@/lib/public-content';");
    expect(pageSource).toContain('<BlogHomePreview');
    expect(previewSource).toContain("from 'framer-motion'");
    expect(previewSource).toContain('function FeaturedReading');
    expect(previewSource).toContain('function RecentUpdates');
    expect(previewSource).toContain('function ContentRoutes');
    expect(previewSource).toContain('Aster.H');
    expect(previewSource).toContain('最新更新');
    expect(previewSource).toContain('文章、笔记、片刻与项目');
    expect(previewSource).not.toContain('Nextlevel Studio');
    expect(previewSource).not.toContain('Live Project');
    expect(styleSource).toContain('.preview');
    expect(styleSource).toContain(':global(:root[data-theme=\'summer-day\'])');
    expect(styleSource).toContain('.featureCard');
    expect(styleSource).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
