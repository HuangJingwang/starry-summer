import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { categoryOrder, recommendedShares } from '@/lib/recommended-shares';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readGlobalStyles() {
  return [
    'src/app/styles/base.css',
    'src/app/styles/public.css',
    'src/app/styles/home.css',
    'src/app/styles/content.css',
    'src/app/styles/leetcode.css',
    'src/app/styles/share.css',
    'src/app/styles/admin.css',
    'src/app/styles/responsive.css',
  ]
    .map((path) => readSource(path))
    .join('\n');
}

function readRule(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector} \\{([\\s\\S]*?)\\n\\}`, 'm'));

  return match?.[1] ?? '';
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

    expect(categoryOrder).toEqual(['全部', '开源项目', 'AI Coding', '前端审美', '工程流程']);
    expect(recommendedShares.map((resource) => resource.name)).toEqual(['Taste Skill', 'Trellis', 'Superpowers']);
    expect(data).toContain("name: 'Taste Skill'");
    expect(data).toContain("name: 'Trellis'");
    expect(data).toContain("name: 'Superpowers'");
    expect(data).not.toContain("name: 'iLoveIMG'");
    expect(data).not.toContain("name: 'TinyPNG'");
    expect(data).not.toContain("name: 'Magic UI'");
  });

  test('styles the share page with separate light and dark themes from the YYsuni reference layout', () => {
    const css = readGlobalStyles();
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

  test('keeps filters and cards compact after search results shrink', () => {
    const css = readGlobalStyles();

    expect(readRule(css, '.share-page')).toContain('align-content: start;');
    expect(readRule(css, '.share-page')).toContain('background: transparent;');
    expect(readRule(css, '.share-page')).not.toContain('background: var(--share-bg);');
    expect(readRule(css, '.share-page__panel')).toContain('align-content: start;');
    expect(readRule(css, '.share-page__filters')).toContain('align-content: start;');
    expect(readRule(css, '.share-page__tag-list')).toContain('align-items: center;');
    expect(readRule(css, '.share-page__tag-list button')).toContain('height: 32px;');
    expect(readRule(css, '.share-page__grid')).toContain('align-items: start;');
    expect(readRule(css, '.share-page__card')).toContain('align-content: start;');
    expect(readRule(css, '.share-page__body')).toContain('align-content: start;');
  });
});
