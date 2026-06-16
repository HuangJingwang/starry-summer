import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('recommended share page', () => {
  test('turns the moments route into the recommended share resource page', () => {
    const page = readSource('src/app/moments/page.tsx');
    const grid = readSource('src/components/RecommendedShareGrid.tsx');
    const data = readSource('src/lib/recommended-shares.ts');

    expect(page).toContain("title: '推荐分享'");
    expect(page).toContain("description: '收藏常用工具、灵感网站、组件库和学习资源。'");
    expect(page).toContain('<RecommendedShareGrid resources={recommendedShares} />');
    expect(page).not.toContain('loadSiteContent');
    expect(page).not.toContain('<ContentCard');

    expect(grid).toContain('placeholder="搜索资源..."');
    expect(grid).toContain('全部');
    expect(grid).toContain('没有找到相关资源');
    expect(grid).toContain('share-page__stars');

    expect(data).toContain("categoryOrder = ['全部', '图片', '人工智能', 'CSS', 'Github', '图标', '组件', '网站集', '3D', '学习']");
    expect(data).toContain("name: 'iLoveIMG'");
    expect(data).toContain("name: 'TinyPNG'");
    expect(data).toContain("name: 'Magic UI'");
  });

  test('styles the share page with separate light and dark themes from the YYsuni reference layout', () => {
    const css = readSource('src/app/styles.css');
    const responsiveCss = readSource('src/app/styles/responsive.css');

    expect(css).toContain('.share-page');
    expect(css).toContain('.share-page__filters');
    expect(css).toContain('.share-page__grid');
    expect(css).toContain('.share-page__card');
    expect(css).toContain('.share-page__logo');
    expect(css).toContain(":root[data-theme='summer-day'] .share-page");
    expect(css).toContain(":root[data-theme='summer-night'] .share-page");
    expect(css).toContain(":root[data-theme='summer-day'] .share-page__card");
    expect(css).toContain(":root[data-theme='summer-night'] .share-page__card");
    expect(responsiveCss).toContain('.share-page__grid');
  });
});
